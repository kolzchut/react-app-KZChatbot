import '@testing-library/jest-dom'

// Mock window.dataLayer
Object.defineProperty(window, 'dataLayer', {
  value: [],
  writable: true,
})

// Mock KZChatbotConfig
Object.defineProperty(window, 'KZChatbotConfig', {
  value: {
    slugs: {
      chat_description: 'Test description',
      welcome_message_first: 'Welcome',
      general_error: 'Error occurred',
      close_chat_icon: 'Close chat',
      questions_daily_limit: 'Daily limit reached'
    },
    questionsPermitted: 5,
    uuid: 'test-uuid',
    referrer: 'test-referrer',
    restPath: '/api',
    chatbotIsShown: true,
    autoOpen: false
  },
  writable: true,
})

// Mock fetch globally
global.fetch = vi.fn()

// Mock DOM methods
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
})

Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: vi.fn(),
  writable: true,
})