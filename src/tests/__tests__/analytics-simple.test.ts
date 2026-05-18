import { pushAnalyticsEvent } from '@/lib/analytics'

describe('Analytics Simple Test', () => {
  beforeEach(() => {
    window.dataLayer = []
  })

  it('should track all analytics events correctly', () => {
    pushAnalyticsEvent('opened', 'button')
    pushAnalyticsEvent('opened', 'embed')
    pushAnalyticsEvent('opened', 'auto-opened')

    pushAnalyticsEvent('question_asked', 'popup')
    pushAnalyticsEvent('question_asked', 'embed')

    pushAnalyticsEvent('closed_unused')
    pushAnalyticsEvent('answer_received')
    pushAnalyticsEvent('error_received', '500: Server error')

    expect(window.dataLayer).toHaveLength(8)

    expect(window.dataLayer[0]).toEqual({
      event: 'chatbot_opened',
      event_action: 'opened',
      event_label: 'button'
    })

    expect(window.dataLayer[1]).toEqual({
      event: 'chatbot_opened',
      event_action: 'opened',
      event_label: 'embed'
    })

    expect(window.dataLayer[2]).toEqual({
      event: 'chatbot_opened',
      event_action: 'opened',
      event_label: 'auto-opened'
    })

    expect(window.dataLayer[3]).toEqual({
      event: 'chatbot_question_asked',
      event_action: 'question_asked',
      event_label: 'popup'
    })

    expect(window.dataLayer[4]).toEqual({
      event: 'chatbot_question_asked',
      event_action: 'question_asked',
      event_label: 'embed'
    })

    expect(window.dataLayer[5]).toEqual({
      event: 'chatbot_closed_unused',
      event_action: 'closed_unused',
      event_label: null
    })

    expect(window.dataLayer[6]).toEqual({
      event: 'chatbot_answer_received',
      event_action: 'answer_received',
      event_label: null
    })

    expect(window.dataLayer[7]).toEqual({
      event: 'chatbot_error_received',
      event_action: 'error_received',
      event_label: '500: Server error'
    })
  })

  it('should verify analytics implementation meets requirements', () => {
    pushAnalyticsEvent('test', 'test-label')
    expect(window.dataLayer[0]).toHaveProperty('event_label', 'test-label')

    const labels = ['button', 'embed', 'auto-opened']
    labels.forEach((label, index) => {
      pushAnalyticsEvent('opened', label)
      expect(window.dataLayer[index + 1].event_label).toBe(label)
    })

    pushAnalyticsEvent('question_asked', 'embed') // From widget
    pushAnalyticsEvent('question_asked', 'popup') // From chatbot interface

    const questionEvents = window.dataLayer.filter(e => e.event_action === 'question_asked')
    expect(questionEvents).toHaveLength(2)
    expect(questionEvents[0].event_label).toBe('embed')
    expect(questionEvents[1].event_label).toBe('popup')

    pushAnalyticsEvent('closed_unused')
    const closedEvent = window.dataLayer.find(e => e.event_action === 'closed_unused')
    expect(closedEvent).toBeDefined()
    expect(closedEvent?.event_label).toBeNull()
  })
})
