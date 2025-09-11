import { pushAnalyticsEvent } from '../analytics'

describe('pushAnalyticsEvent', () => {
  beforeEach(() => {
    window.dataLayer = []
  })

  it('should push event without source', () => {
    pushAnalyticsEvent('test_event', 'test_label')
    
    expect(window.dataLayer).toHaveLength(1)
    expect(window.dataLayer[0]).toEqual({
      event: 'chatbot',
      event_action: 'test_event',
      event_label: 'test_label'
    })
  })

  it('should push event with source', () => {
    pushAnalyticsEvent('question_asked', null, 'embed')
    
    expect(window.dataLayer).toHaveLength(1)
    expect(window.dataLayer[0]).toEqual({
      event: 'chatbot',
      event_action: 'question_asked',
      event_label: null,
      source: 'embed'
    })
  })

  it('should not include source when undefined', () => {
    pushAnalyticsEvent('test_event')
    
    expect(window.dataLayer[0]).not.toHaveProperty('source')
  })

  it('should push opened event with button source', () => {
    pushAnalyticsEvent('opened', null, 'button')
    
    expect(window.dataLayer).toHaveLength(1)
    expect(window.dataLayer[0]).toEqual({
      event: 'chatbot',
      event_action: 'opened',
      event_label: null,
      source: 'button'
    })
  })

  it('should push opened event with embed source', () => {
    pushAnalyticsEvent('opened', null, 'embed')
    
    expect(window.dataLayer).toHaveLength(1)
    expect(window.dataLayer[0]).toEqual({
      event: 'chatbot',
      event_action: 'opened',
      event_label: null,
      source: 'embed'
    })
  })

  it('should push opened event with auto-opened source', () => {
    pushAnalyticsEvent('opened', null, 'auto-opened')
    
    expect(window.dataLayer).toHaveLength(1)
    expect(window.dataLayer[0]).toEqual({
      event: 'chatbot',
      event_action: 'opened',
      event_label: null,
      source: 'auto-opened'
    })
  })

  it('should push question_asked event with popup source', () => {
    pushAnalyticsEvent('question_asked', null, 'popup')
    
    expect(window.dataLayer).toHaveLength(1)
    expect(window.dataLayer[0]).toEqual({
      event: 'chatbot',
      event_action: 'question_asked',
      event_label: null,
      source: 'popup'
    })
  })

  it('should push closed_unused event', () => {
    pushAnalyticsEvent('closed_unused')
    
    expect(window.dataLayer).toHaveLength(1)
    expect(window.dataLayer[0]).toEqual({
      event: 'chatbot',
      event_action: 'closed_unused',
      event_label: null
    })
  })

  it('should initialize dataLayer if not exists', () => {
    // @ts-expect-error - Mock undefined dataLayer
    const originalDataLayer = window.dataLayer
    // @ts-expect-error - Testing environment cleanup
    window.dataLayer = undefined
    
    pushAnalyticsEvent('test_event')
    
    expect(window.dataLayer).toBeDefined()
    expect(window.dataLayer).toHaveLength(1)
    
    // Restore original
    window.dataLayer = originalDataLayer
  })

  it('should handle multiple events', () => {
    pushAnalyticsEvent('opened', null, 'button')
    pushAnalyticsEvent('question_asked', null, 'popup')
    pushAnalyticsEvent('answer_received')
    
    expect(window.dataLayer).toHaveLength(3)
    expect(window.dataLayer[0]).toEqual({
      event: 'chatbot',
      event_action: 'opened',
      event_label: null,
      source: 'button'
    })
    expect(window.dataLayer[1]).toEqual({
      event: 'chatbot',
      event_action: 'question_asked',
      event_label: null,
      source: 'popup'
    })
    expect(window.dataLayer[2]).toEqual({
      event: 'chatbot',
      event_action: 'answer_received',
      event_label: null
    })
  })
})