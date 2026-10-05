import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useConversationSubmit } from '../useConversationSubmit'
import { appendBotMessage } from '@/store/slices/conversationSlice'
import { pushAnalyticsEvent } from '@/lib/analytics'
import { MessageType } from '@/types'

vi.mock('@/lib/analytics', () => ({
  pushAnalyticsEvent: vi.fn()
}))

// --- Error-message trust gate (kolzchut/kz-mediawiki-main#98) ----------------
// A 4xx message is ours: the endpoint throws HttpException carrying an
// operator-authored slug, written to be read by the person in the chat window.
// A 5xx message is not ours — MediaWiki's REST layer produces
// `Error: exception of type <Class>`, and rendering that verbatim is how a PHP
// bug reached readers as an English class name for 13 hours on 2026-08-10.
//
// fetch is mocked rather than askQuestion, so these cover the parsing in
// chatbotApi and the gate in the hook together.

const GENERAL_ERROR = 'general-error-slug-under-test'
const mockFetch = vi.mocked(global.fetch)

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status })

const submitAndGetErrorMessage = async (response: Response) => {
  mockFetch.mockResolvedValueOnce(response)
  const dispatch = vi.fn()

  // The hook submits from an effect whenever the question is non-empty, so
  // rendering it is the submission.
  renderHook(() =>
    useConversationSubmit({
      config: {
        ...window.KZChatbotConfig,
        uuid: 'test-uuid',
        chatbotIsShown: true,
        slugs: { ...window.KZChatbotConfig.slugs },
      },
      question: 'Test question',
      source: 'popup',
      conversationState: { sessionId: 's', activeConversationId: 'c', maxQuestionsPerConversation: 10 },
      activeQuestionCount: 0,
      quotaReached: false,
      dispatch,
      resetQuestion: vi.fn(),
      t: (key) => (key === 'general_error' ? GENERAL_ERROR : key),
    })
  )

  const errorMessages = () =>
    dispatch.mock.calls
      .map(([action]) => action)
      .filter((action) => action.type === appendBotMessage.type && action.payload.type === MessageType.Error)
  await waitFor(() => expect(errorMessages()).toHaveLength(1))
  return errorMessages()[0].payload.content
}

describe('useConversationSubmit error handling', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    vi.mocked(pushAnalyticsEvent).mockClear()
  })

  it('does not render a 5xx server message, showing the general error instead', async () => {
    const content = await submitAndGetErrorMessage(
      jsonResponse(500, { message: 'Error: exception of type ArgumentCountError' })
    )

    expect(content).toBe(GENERAL_ERROR)
    expect(content).not.toContain('ArgumentCountError')
  })

  it('still renders a 4xx server message, which is an operator-authored slug', async () => {
    const bannedWordReply = 'על השאלה לכלול שלוש מילים לכל הפחות'

    const content = await submitAndGetErrorMessage(jsonResponse(403, { message: bannedWordReply }))

    expect(content).toBe(bannedWordReply)
  })

  it('falls back to the general error and keeps the status when the body is not JSON', async () => {
    // e.g. an HTML 502 from the edge, which never reaches the PHP handler.
    const content = await submitAndGetErrorMessage(
      new Response('<html>Bad Gateway</html>', { status: 502, statusText: 'Bad Gateway' })
    )

    expect(content).toBe(GENERAL_ERROR)
    expect(pushAnalyticsEvent).toHaveBeenCalledWith('error_received', '502: Bad Gateway')
  })
})
