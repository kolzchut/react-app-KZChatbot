import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import Chatbot from '../Chatbot'
import chatSlice from '@/store/slices/chatSlice'
import questionSlice from '@/store/slices/questionSlice'
import { pushAnalyticsEvent } from '@/lib/analytics'
import { TranslationProvider } from '@/contexts/TranslationContext'

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  pushAnalyticsEvent: vi.fn()
}))

// Mock useMobile hook
vi.mock('@/lib/useMobile', () => ({
  useMobile: vi.fn(() => false)
}))

// Mock all the complex child components with simpler versions
vi.mock('@/components', () => ({
  Messages: React.forwardRef<HTMLDivElement, { messages: unknown[] }>(({ messages }, ref) => {
    const divRef = React.useRef<HTMLDivElement>(null)
    
    React.useEffect(() => {
      if (ref && typeof ref === 'object' && 'current' in ref && divRef.current) {
        ref.current = divRef.current
        // Mock scrollTo and scrollHeight for the ref
        Object.defineProperty(divRef.current, 'scrollTo', {
          value: vi.fn(),
          writable: true
        })
        Object.defineProperty(divRef.current, 'scrollHeight', {
          value: 1000,
          writable: true
        })
      }
    }, [ref])

    return (
      <div data-testid="messages" ref={divRef}>
        {messages.map((msg, index) => (
          <div key={index} data-testid={`message-${msg.type}`}>
            {msg.content}
          </div>
        ))}
      </div>
    )
  }),
  Popover: ({ children, isChatOpen }: { children: React.ReactNode, isChatOpen: boolean }) => (
    <div data-testid="popover" data-open={isChatOpen}>
      {isChatOpen && children}
    </div>
  ),
  PopoverContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popover-content">{children}</div>
  ),
  Footer: ({ handleSubmit, showInput }: { handleSubmit: (e: React.FormEvent) => void; showInput: boolean }) => (
    <div data-testid="footer">
      {showInput && (
        <form onSubmit={handleSubmit} data-testid="chat-form">
          <button type="submit" data-testid="submit-button">Submit</button>
        </form>
      )}
    </div>
  ),
  ClosePopover: ({ handleChatSetIsOpen }: { handleChatSetIsOpen: () => void }) => (
    <button onClick={handleChatSetIsOpen} data-testid="close-button">Close</button>
  ),
}))

// Mock WebiksFooter
vi.mock('../webiksFooter/WebiksFooter', () => ({
  default: () => <div data-testid="webiks-footer" />
}))

const mockPushAnalyticsEvent = vi.mocked(pushAnalyticsEvent)
const mockFetch = vi.mocked(global.fetch)

const createTestStore = (initialState?: Record<string, unknown>) => configureStore({
  reducer: {
    chat: chatSlice,
    question: questionSlice
  },
  preloadedState: initialState
})

const renderWithProviders = (component: React.ReactElement, store: ReturnType<typeof createTestStore>) => {
  return render(
    <Provider store={store}>
      <TranslationProvider>
        {component}
      </TranslationProvider>
    </Provider>
  )
}

describe('Chatbot Analytics - Simple Tests', () => {
  beforeEach(() => {
    mockPushAnalyticsEvent.mockClear()
    mockFetch.mockClear()
    
    window.KZChatbotConfig = {
      ...window.KZChatbotConfig,
      autoOpen: false,
      questionsPermitted: 5,
      chatbotIsShown: true,
      uuid: 'test-uuid',
      slugs: {
        ...window.KZChatbotConfig.slugs,
        welcome_message: 'Welcome message',
        questions_daily_limit: 'Daily limit reached'
      }
    }
  })

  it('should track auto-opened event when autoOpen is true', () => {
    window.KZChatbotConfig.autoOpen = true
    const store = createTestStore()

    renderWithProviders(<Chatbot />, store)

    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('opened', 'auto-opened')
  })

  it('should not track auto-opened event when autoOpen is false', () => {
    window.KZChatbotConfig.autoOpen = false
    const store = createTestStore()

    renderWithProviders(<Chatbot />, store)

    expect(mockPushAnalyticsEvent).not.toHaveBeenCalledWith('opened', 'auto-opened')
  })

  it('should track closed_unused when closed without asking questions', () => {
    const store = createTestStore({
      chat: { isChatOpen: true },
      question: { question: '', source: undefined }
    })

    renderWithProviders(<Chatbot />, store)

    const closeButton = screen.getByTestId('close-button')
    fireEvent.click(closeButton)

    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('closed_unused')
  })

  it('should track question_asked with correct source', async () => {
    const store = createTestStore({
      chat: { isChatOpen: true },
      question: { question: 'Test question', source: 'embed' }
    })

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        llmResult: 'Test answer',
        conversationId: 'test-id'
      })
    } as Response)

    renderWithProviders(<Chatbot />, store)

    const form = screen.getByTestId('chat-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('question_asked', 'embed')
    })
  })

  it('should track answer_received event', async () => {
    const store = createTestStore({
      chat: { isChatOpen: true },
      question: { question: 'Test question', source: undefined }
    })

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        llmResult: 'Test answer',
        conversationId: 'test-id'
      })
    } as Response)

    renderWithProviders(<Chatbot />, store)

    const form = screen.getByTestId('chat-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('answer_received')
    })
  })

  it('should track error_received event on API error', async () => {
    const store = createTestStore({
      chat: { isChatOpen: true },
      question: { question: 'Test question', source: undefined }
    })

    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({
        message: 'Internal server error'
      })
    } as Response)

    renderWithProviders(<Chatbot />, store)

    const form = screen.getByTestId('chat-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('error_received', '500: Internal server error')
    })
  })

  it('should close chat when close button is clicked', () => {
    const store = createTestStore({
      chat: { isChatOpen: true },
      question: { question: '', source: undefined }
    })

    renderWithProviders(<Chatbot />, store)

    const closeButton = screen.getByTestId('close-button')
    fireEvent.click(closeButton)

    const state = store.getState()
    expect(state.chat.isChatOpen).toBe(false)
  })

  // --- Error-message trust gate (kolzchut/kz-mediawiki-main#98) --------------
  // A 4xx message is ours: the endpoint throws HttpException carrying an
  // operator-authored slug, written to be read by the person in the chat
  // window. A 5xx message is not ours — MediaWiki's REST layer produces
  // `Error: exception of type <Class>`, and rendering that verbatim is how a
  // PHP bug reached readers as an English class name for 13 hours on
  // 2026-08-10.

  // Set explicitly rather than asserting against the compiled-in i18n default:
  // t() resolves general_error from KZChatbotConfig.slugs, the operator-editable
  // source, so the default is not what renders.
  const GENERAL_ERROR = 'general-error-slug-under-test'

  const submitWith = (response: Partial<Response>) => {
    window.KZChatbotConfig.slugs = {
      ...window.KZChatbotConfig.slugs,
      general_error: GENERAL_ERROR
    }
    const store = createTestStore({
      chat: { isChatOpen: true },
      question: { question: 'Test question', source: undefined }
    })
    mockFetch.mockResolvedValue(response as Response)
    renderWithProviders(<Chatbot />, store)
    fireEvent.submit(screen.getByTestId('chat-form'))
  }

  it('does not render a 5xx server message, showing the general error instead', async () => {
    submitWith({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Error: exception of type ArgumentCountError' })
    })

    await waitFor(() => {
      expect(screen.getByTestId('messages')).toHaveTextContent(GENERAL_ERROR)
    })
    expect(screen.getByTestId('messages')).not.toHaveTextContent('ArgumentCountError')
  })

  it('still renders a 4xx server message, which is an operator-authored slug', async () => {
    const bannedWordReply = 'על השאלה לכלול שלוש מילים לכל הפחות'
    submitWith({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ message: bannedWordReply })
    })

    await waitFor(() => {
      expect(screen.getByTestId('messages')).toHaveTextContent(bannedWordReply)
    })
  })

  it('falls back to the general error when the body is not JSON', async () => {
    // e.g. an HTML 502 from the edge, which never reaches the PHP handler.
    submitWith({
      ok: false,
      status: 502,
      json: () => Promise.reject(new SyntaxError('Unexpected token <'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('messages')).toHaveTextContent(GENERAL_ERROR)
    })
    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('error_received', '502: (no message)')
  })
})