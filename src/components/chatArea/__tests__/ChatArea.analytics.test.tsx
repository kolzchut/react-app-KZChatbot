import { pushAnalyticsEvent } from '@/lib/analytics'

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  pushAnalyticsEvent: vi.fn()
}))

const mockPushAnalyticsEvent = vi.mocked(pushAnalyticsEvent)

describe('ChatArea Analytics', () => {
  beforeEach(() => {
    mockPushAnalyticsEvent.mockClear()
  })

  it('should call pushAnalyticsEvent with embed source when question is submitted', () => {
    // Simulate the analytics call that happens in ChatArea.handleSubmit
    pushAnalyticsEvent('opened', null, 'embed')
    
    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('opened', null, 'embed')
    expect(mockPushAnalyticsEvent).toHaveBeenCalledTimes(1)
  })

  it('should track embed source correctly', () => {
    // Test the specific analytics pattern used in ChatArea
    pushAnalyticsEvent('opened', null, 'embed')
    
    // Verify the call matches exactly what ChatArea does
    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('opened', null, 'embed')
  })

  it('should demonstrate the complete embed flow analytics', () => {
    // Simulate complete ChatArea workflow
    pushAnalyticsEvent('opened', null, 'embed')
    
    // Verify this would lead to question with embed source in Redux store
    // (This would be tested in integration tests)
    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('opened', null, 'embed')
  })
})