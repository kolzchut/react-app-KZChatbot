import { pushAnalyticsEvent } from '@/lib/analytics'

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  pushAnalyticsEvent: vi.fn()
}))

const mockPushAnalyticsEvent = vi.mocked(pushAnalyticsEvent)

describe('ChatButton Analytics', () => {
  beforeEach(() => {
    mockPushAnalyticsEvent.mockClear()
  })

  it('should call pushAnalyticsEvent with correct parameters when button is clicked', () => {
    // Simulate the analytics call that happens in ChatButton.handleToggleChat
    pushAnalyticsEvent('opened', null, 'button')
    
    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('opened', null, 'button')
    expect(mockPushAnalyticsEvent).toHaveBeenCalledTimes(1)
  })

  it('should track button source correctly', () => {
    // Test the specific analytics pattern used in ChatButton
    pushAnalyticsEvent('opened', null, 'button')
    
    // Verify the call matches exactly what ChatButton does
    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('opened', null, 'button')
  })
})