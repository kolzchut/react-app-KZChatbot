import { pushAnalyticsEvent } from '@/lib/analytics'

describe('Analytics Demo - Complete User Journey', () => {
  beforeEach(() => {
    window.dataLayer = []
  })

  it('should demonstrate complete user journey analytics', () => {
    // Scenario 1: User uses embed widget
    pushAnalyticsEvent('opened', 'embed')
    pushAnalyticsEvent('question_asked', 'embed')
    pushAnalyticsEvent('answer_received')

    // Scenario 2: User clicks chat button
    pushAnalyticsEvent('opened', 'button')
    pushAnalyticsEvent('question_asked', 'popup')
    pushAnalyticsEvent('answer_received')

    // Scenario 3: Auto-opened chat
    pushAnalyticsEvent('opened', 'auto-opened')
    pushAnalyticsEvent('closed_unused')

    // Scenario 4: Error handling
    pushAnalyticsEvent('opened', 'button')
    pushAnalyticsEvent('question_asked', 'popup')
    pushAnalyticsEvent('error_received', '500: Internal server error')

    expect(window.dataLayer).toHaveLength(11)
  })

  it('should verify event_label differentiation', () => {
    const testCases = [
      { action: 'opened', label: 'button' },
      { action: 'opened', label: 'embed' },
      { action: 'opened', label: 'auto-opened' },
      { action: 'question_asked', label: 'popup' },
      { action: 'question_asked', label: 'embed' },
      { action: 'closed_unused', label: null }
    ] as const

    testCases.forEach((testCase, index) => {
      pushAnalyticsEvent(testCase.action, testCase.label)

      const event = window.dataLayer[index]
      expect(event.event_action).toBe(testCase.action)
      expect(event.event_label).toBe(testCase.label)
    })

    expect(window.dataLayer).toHaveLength(testCases.length)
  })
})
