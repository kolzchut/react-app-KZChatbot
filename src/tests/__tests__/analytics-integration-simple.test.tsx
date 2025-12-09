import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { TranslationProvider } from '@/contexts/TranslationContext'
import ChatButton from '@/components/chatButton/ChatButton'
import Chatbot from '@/components/chatbot/Chatbot'
import chatSlice from '@/store/slices/chatSlice'
import questionSlice from '@/store/slices/questionSlice'

// Mock complex components for integration testing
vi.mock('@/components', () => ({
  Messages: React.forwardRef<HTMLDivElement, { messages: unknown[] }>(({ messages }, ref) => {
    const divRef = React.useRef<HTMLDivElement>(null)
    
    React.useEffect(() => {
      if (ref && typeof ref === 'object' && 'current' in ref && divRef.current) {
        ref.current = divRef.current
        // Mock scrollTo and scrollHeight for the ref
        Object.defineProperty(divRef.current, 'scrollTo', {
          value: vi.fn(),
          writable: true
        })
        Object.defineProperty(divRef.current, 'scrollHeight', {
          value: 1000,
          writable: true
        })
      }
    }, [ref])

    return (
      <div data-testid="messages" ref={divRef}>
        {messages.map((msg, index) => (
          <div key={index} data-testid={`message-${msg.type}`}>
            {msg.content}
          </div>
        ))}
      </div>
    )
  }),
  Popover: ({ children, isChatOpen }: { children: React.ReactNode, isChatOpen: boolean }) => (
    <div data-testid="popover" data-open={isChatOpen}>
      {isChatOpen && children}
    </div>
  ),
  PopoverContent: ({ children, className }: { children: React.ReactNode, className: string }) => (
    <div data-testid="popover-content" className={className}>
      {children}
    </div>
  ),
  Footer: ({ handleSubmit, isLoading, showInput }: { 
    handleSubmit: (e: React.FormEvent) => void
    isLoading: boolean
    showInput: boolean
  }) => (
    <div data-testid="footer">
      {showInput && (
        <form onSubmit={handleSubmit} data-testid="chat-form">
          <input data-testid="footer-input" />
          <button type="submit" disabled={isLoading} data-testid="submit-button">
            Submit
          </button>
        </form>
      )}
    </div>
  ),
  ClosePopover: ({ handleChatSetIsOpen }: { handleChatSetIsOpen: () => void }) => (
    <button onClick={handleChatSetIsOpen} data-testid="close-button" aria-label="Close chat">
      Close
    </button>
  ),
}))

// Mock other components
vi.mock('@/components/chatbot/webiksFooter/WebiksFooter', () => ({
  default: () => <div data-testid="webiks-footer" />
}))

vi.mock('@/components/chatButton/Stars', () => ({
  default: ({ className }: { className: string }) => <div className={className} data-testid="stars-icon" />
}))

vi.mock('@/lib/useMobile', () => ({
  useMobile: vi.fn(() => false)
}))

const mockFetch = vi.mocked(global.fetch)

describe('Analytics Integration - Simple', () => {
  beforeEach(() => {
    window.dataLayer = []
    mockFetch.mockClear()
    
    window.KZChatbotConfig = {
      ...window.KZChatbotConfig,
      autoOpen: false,
      questionsPermitted: 5,
      chatbotIsShown: true,
      uuid: 'test-uuid',
      slugs: {
        ...window.KZChatbotConfig.slugs,
        chat_description: 'Ask our AI',
        welcome_message_first: 'Welcome!',
        questions_daily_limit: 'Daily limit reached'
      }
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 
        llmResult: 'Test response',
        conversationId: 'test-conversation-id',
        docs: []
      })
    } as Response)
  })

  it('should track button click analytics', () => {
    const store = configureStore({
      reducer: { chat: chatSlice, question: questionSlice }
    })

    render(
      <Provider store={store}>
        <TranslationProvider>
        <ChatButton />
      </TranslationProvider>
      </Provider>
    )

    // Click chat button
    const button = screen.getByRole('button', { name: /ask our ai/i })
    fireEvent.click(button)

    // Check that opened event with button source was tracked
    expect(window.dataLayer).toContainEqual({
      event: 'chatbot',
      event_action: 'opened',
      event_label: null,
      source: 'button'
    })

    // Verify chat is opened
    const state = store.getState()
    expect(state.chat.isChatOpen).toBe(true)
  })

  it('should track auto-open analytics', () => {
    window.KZChatbotConfig.autoOpen = true
    
    const store = configureStore({
      reducer: { chat: chatSlice, question: questionSlice }
    })

    render(
      <Provider store={store}>
        <TranslationProvider>
        <Chatbot />
      </TranslationProvider>
      </Provider>
    )

    // Check that opened event with auto-opened source was tracked
    expect(window.dataLayer).toContainEqual({
      event: 'chatbot',
      event_action: 'opened',
      event_label: null,
      source: 'auto-opened'
    })

    // Check that chat is open
    const state = store.getState()
    expect(state.chat.isChatOpen).toBe(true)
  })

  it('should track unused closure analytics', () => {
    const store = configureStore({
      reducer: { 
        chat: chatSlice, 
        question: questionSlice 
      },
      preloadedState: {
        chat: { isChatOpen: true },
        question: { question: '', source: undefined }
      }
    })

    render(
      <Provider store={store}>
        <TranslationProvider>
        <Chatbot />
      </TranslationProvider>
      </Provider>
    )

    // Close without asking questions
    const closeButton = screen.getByTestId('close-button')
    fireEvent.click(closeButton)

    // Check that closed_unused event was tracked
    expect(window.dataLayer).toContainEqual({
      event: 'chatbot',
      event_action: 'closed_unused',
      event_label: null
    })

    // Check that chat is closed
    const state = store.getState()
    expect(state.chat.isChatOpen).toBe(false)
  })

  it('should track multiple button interactions', () => {
    const store = configureStore({
      reducer: { chat: chatSlice, question: questionSlice }
    })

    render(
      <Provider store={store}>
        <TranslationProvider>
        <ChatButton />
        <Chatbot />
      </TranslationProvider>
      </Provider>
    )

    // 1. Click button to open
    const chatButton = screen.getByRole('button', { name: /ask our ai/i })
    fireEvent.click(chatButton)

    // Verify opened event
    expect(window.dataLayer).toContainEqual({
      event: 'chatbot',
      event_action: 'opened',
      event_label: null,
      source: 'button'
    })

    // 2. Close the chat without asking questions
    const closeButton = screen.getByTestId('close-button')
    fireEvent.click(closeButton)

    // Verify closed_unused event
    expect(window.dataLayer).toContainEqual({
      event: 'chatbot',
      event_action: 'closed_unused',
      event_label: null
    })

    // 3. Open again
    fireEvent.click(chatButton)

    // Verify second opened event
    const openedEvents = window.dataLayer.filter(e => e.event_action === 'opened')
    expect(openedEvents).toHaveLength(2)
    expect(openedEvents[1]).toEqual({
      event: 'chatbot',
      event_action: 'opened',
      event_label: null,
      source: 'button'
    })
  })

  it('should verify analytics system is working correctly', () => {
    const store = configureStore({
      reducer: { chat: chatSlice, question: questionSlice }
    })

    render(
      <Provider store={store}>
        <TranslationProvider>
        <ChatButton />
        <Chatbot />
      </TranslationProvider>
      </Provider>
    )

    // Open chat
    const chatButton = screen.getByRole('button', { name: /ask our ai/i })
    fireEvent.click(chatButton)

    // Verify analytics tracking
    expect(window.dataLayer).toHaveLength(1)
    expect(window.dataLayer[0]).toMatchObject({
      event: 'chatbot',
      event_action: 'opened',
      source: 'button'
    })

    // Verify state changes
    const state = store.getState()
    expect(state.chat.isChatOpen).toBe(true)
  })
})