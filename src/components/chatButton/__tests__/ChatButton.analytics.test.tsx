import { pushAnalyticsEvent } from '@/lib/analytics'

vi.mock('@/lib/analytics', () => ({
  pushAnalyticsEvent: vi.fn()
}))

const mockPushAnalyticsEvent = vi.mocked(pushAnalyticsEvent)

describe('ChatButton Analytics', () => {
  beforeEach(() => {
    mockPushAnalyticsEvent.mockClear()
  })

  it('should call pushAnalyticsEvent with correct parameters when button is clicked', () => {
    pushAnalyticsEvent('opened', 'button')

    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('opened', 'button')
    expect(mockPushAnalyticsEvent).toHaveBeenCalledTimes(1)
  })

  it('should track button label correctly', () => {
    pushAnalyticsEvent('opened', 'button')

    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('opened', 'button')
  })
})
