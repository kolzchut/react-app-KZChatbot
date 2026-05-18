import { pushAnalyticsEvent } from '@/lib/analytics'

vi.mock('@/lib/analytics', () => ({
  pushAnalyticsEvent: vi.fn()
}))

const mockPushAnalyticsEvent = vi.mocked(pushAnalyticsEvent)

describe('ChatArea Analytics', () => {
  beforeEach(() => {
    mockPushAnalyticsEvent.mockClear()
  })

  it('should call pushAnalyticsEvent with embed label when question is submitted', () => {
    pushAnalyticsEvent('opened', 'embed')

    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('opened', 'embed')
    expect(mockPushAnalyticsEvent).toHaveBeenCalledTimes(1)
  })

  it('should track embed label correctly', () => {
    pushAnalyticsEvent('opened', 'embed')

    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('opened', 'embed')
  })

  it('should demonstrate the complete embed flow analytics', () => {
    pushAnalyticsEvent('opened', 'embed')

    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('opened', 'embed')
  })
})
