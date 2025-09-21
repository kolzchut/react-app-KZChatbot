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
    // Simulate the analytics call that happens when autoOpen is true
    pushAnalyticsEvent('opened', null, 'auto-opened')
    
    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('opened', null, 'auto-opened')
  })

  it('should track question_asked with popup source', () => {
    // Simulate the analytics call from regular chatbot interface
    pushAnalyticsEvent('question_asked', null, 'popup')
    
    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('question_asked', null, 'popup')
  })

  it('should track question_asked with embed source', () => {
    // Simulate the analytics call from embed widget question
    pushAnalyticsEvent('question_asked', null, 'embed')
    
    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('question_asked', null, 'embed')
  })

  it('should track closed_unused event', () => {
    // Simulate the analytics call when chat is closed without questions
    pushAnalyticsEvent('closed_unused')
    
    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('closed_unused')
  })

  it('should track answer_received event', () => {
    // Simulate successful API response
    pushAnalyticsEvent('answer_received')
    
    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('answer_received')
  })

  it('should track error_received event', () => {
    // Simulate API error response
    pushAnalyticsEvent('error_received', '500: Internal server error')
    
    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('error_received', '500: Internal server error')
  })

  it('should demonstrate complete chatbot analytics workflow', () => {
    // Simulate a complete user session
    pushAnalyticsEvent('opened', null, 'button')
    pushAnalyticsEvent('question_asked', null, 'popup')
    pushAnalyticsEvent('answer_received')
    
    expect(mockPushAnalyticsEvent).toHaveBeenCalledTimes(3)
    expect(mockPushAnalyticsEvent).toHaveBeenNthCalledWith(1, 'opened', null, 'button')
    expect(mockPushAnalyticsEvent).toHaveBeenNthCalledWith(2, 'question_asked', null, 'popup')
    expect(mockPushAnalyticsEvent).toHaveBeenNthCalledWith(3, 'answer_received')
  })
})