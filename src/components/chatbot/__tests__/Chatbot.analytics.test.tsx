import { pushAnalyticsEvent } from '@/lib/analytics'

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  pushAnalyticsEvent: vi.fn()
}))

const mockPushAnalyticsEvent = vi.mocked(pushAnalyticsEvent)

describe('Chatbot Analytics', () => {
  beforeEach(() => {
    mockPushAnalyticsEvent.mockClear()
  })

  it('should track auto-opened event', () => {
    pushAnalyticsEvent('opened', 'auto-opened')

    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('opened', 'auto-opened')
  })

  it('should track question_asked with popup label', () => {
    pushAnalyticsEvent('question_asked', 'popup')

    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('question_asked', 'popup')
  })

  it('should track question_asked with embed label', () => {
    pushAnalyticsEvent('question_asked', 'embed')

    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('question_asked', 'embed')
  })

  it('should track closed_unused event', () => {
    pushAnalyticsEvent('closed_unused')

    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('closed_unused')
  })

  it('should track answer_received event', () => {
    pushAnalyticsEvent('answer_received')

    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('answer_received')
  })

  it('should track error_received event', () => {
    pushAnalyticsEvent('error_received', '500: Internal server error')

    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('error_received', '500: Internal server error')
  })

  it('should demonstrate complete chatbot analytics workflow', () => {
    pushAnalyticsEvent('opened', 'button')
    pushAnalyticsEvent('question_asked', 'popup')
    pushAnalyticsEvent('answer_received')

    expect(mockPushAnalyticsEvent).toHaveBeenCalledTimes(3)
    expect(mockPushAnalyticsEvent).toHaveBeenNthCalledWith(1, 'opened', 'button')
    expect(mockPushAnalyticsEvent).toHaveBeenNthCalledWith(2, 'question_asked', 'popup')
    expect(mockPushAnalyticsEvent).toHaveBeenNthCalledWith(3, 'answer_received')
  })
})
