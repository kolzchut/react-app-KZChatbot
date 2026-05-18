import { pushAnalyticsEvent } from '../analytics'

describe('pushAnalyticsEvent', () => {
  beforeEach(() => {
    window.dataLayer = []
  })

  it('should push event with a label', () => {
    pushAnalyticsEvent('test_event', 'test_label')

    expect(window.dataLayer).toHaveLength(1)
    expect(window.dataLayer[0]).toEqual({
      event: 'chatbot_test_event',
      event_action: 'test_event',
      event_label: 'test_label'
    })
  })

  it('should push event with null label when omitted', () => {
    pushAnalyticsEvent('test_event')

    expect(window.dataLayer).toHaveLength(1)
    expect(window.dataLayer[0]).toEqual({
      event: 'chatbot_test_event',
      event_action: 'test_event',
      event_label: null
    })
  })

  it('should push opened event with button label', () => {
    pushAnalyticsEvent('opened', 'button')

    expect(window.dataLayer[0]).toEqual({
      event: 'chatbot_opened',
      event_action: 'opened',
      event_label: 'button'
    })
  })

  it('should push opened event with embed label', () => {
    pushAnalyticsEvent('opened', 'embed')

    expect(window.dataLayer[0]).toEqual({
      event: 'chatbot_opened',
      event_action: 'opened',
      event_label: 'embed'
    })
  })

  it('should push opened event with auto-opened label', () => {
    pushAnalyticsEvent('opened', 'auto-opened')

    expect(window.dataLayer[0]).toEqual({
      event: 'chatbot_opened',
      event_action: 'opened',
      event_label: 'auto-opened'
    })
  })

  it('should push question_asked event with popup label', () => {
    pushAnalyticsEvent('question_asked', 'popup')

    expect(window.dataLayer[0]).toEqual({
      event: 'chatbot_question_asked',
      event_action: 'question_asked',
      event_label: 'popup'
    })
  })

  it('should push closed_unused event', () => {
    pushAnalyticsEvent('closed_unused')

    expect(window.dataLayer[0]).toEqual({
      event: 'chatbot_closed_unused',
      event_action: 'closed_unused',
      event_label: null
    })
  })

  it('should initialize dataLayer if not exists', () => {
    // @ts-expect-error - Testing environment cleanup
    window.dataLayer = undefined

    pushAnalyticsEvent('test_event')

    expect(window.dataLayer).toBeDefined()
    expect(window.dataLayer).toHaveLength(1)
  })

  it('should handle multiple events', () => {
    pushAnalyticsEvent('opened', 'button')
    pushAnalyticsEvent('question_asked', 'popup')
    pushAnalyticsEvent('answer_received')

    expect(window.dataLayer).toHaveLength(3)
    expect(window.dataLayer[0]).toEqual({
      event: 'chatbot_opened',
      event_action: 'opened',
      event_label: 'button'
    })
    expect(window.dataLayer[1]).toEqual({
      event: 'chatbot_question_asked',
      event_action: 'question_asked',
      event_label: 'popup'
    })
    expect(window.dataLayer[2]).toEqual({
      event: 'chatbot_answer_received',
      event_action: 'answer_received',
      event_label: null
    })
  })
})
