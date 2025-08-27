import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import ChatArea from '../ChatArea'
import chatSlice from '@/store/slices/chatSlice'
import questionSlice from '@/store/slices/questionSlice'
import { pushAnalyticsEvent } from '@/lib/analytics'

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  pushAnalyticsEvent: vi.fn()
}))

// Mock ChatInput component
vi.mock('../../chatbot/chatInput/ChatInput', () => ({
  default: ({ handleSubmit, question, handleOnMessageChange, disabled }: any) => (
    <form onSubmit={handleSubmit} data-testid="chat-input-form">
      <input
        type="text"
        value={question}
        onChange={handleOnMessageChange}
        disabled={disabled}
        data-testid="chat-input"
        placeholder="Type your question..."
      />
      <button type="submit" disabled={disabled} data-testid="submit-button">
        Submit
      </button>
    </form>
  )
}))

const mockPushAnalyticsEvent = vi.mocked(pushAnalyticsEvent)

const createTestStore = () => configureStore({
  reducer: {
    chat: chatSlice,
    question: questionSlice
  }
})

describe('ChatArea', () => {
  beforeEach(() => {
    mockPushAnalyticsEvent.mockClear()
    window.KZChatbotConfig = {
      ...window.KZChatbotConfig,
      slugs: {
        ...window.KZChatbotConfig.slugs,
        chat_description: 'Test chat description'
      }
    }
  })

  it('should render with chat description', () => {
    const store = createTestStore()
    
    render(
      <Provider store={store}>
        <ChatArea />
      </Provider>
    )

    expect(screen.getByText('Test chat description')).toBeInTheDocument()
    expect(screen.getByTestId('chat-input')).toBeInTheDocument()
  })

  it('should track analytics when question is submitted from embed', async () => {
    const user = userEvent.setup()
    const store = createTestStore()
    
    render(
      <Provider store={store}>
        <ChatArea />
      </Provider>
    )

    const input = screen.getByTestId('chat-input')
    await user.type(input, 'Test question')
    
    const form = screen.getByTestId('chat-input-form')
    fireEvent.submit(form)

    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('opened', null, 'embed')
    expect(mockPushAnalyticsEvent).toHaveBeenCalledTimes(1)
  })

  it('should set question with embed source in store', async () => {
    const user = userEvent.setup()
    const store = createTestStore()
    
    render(
      <Provider store={store}>
        <ChatArea />
      </Provider>
    )

    const input = screen.getByTestId('chat-input')
    await user.type(input, 'Test question from embed')
    
    const form = screen.getByTestId('chat-input-form')
    fireEvent.submit(form)

    const state = store.getState()
    expect(state.question.question).toBe('Test question from embed')
    expect(state.question.source).toBe('embed')
  })

  it('should open chat when question is submitted', async () => {
    const user = userEvent.setup()
    const store = createTestStore()
    
    render(
      <Provider store={store}>
        <ChatArea />
      </Provider>
    )

    const input = screen.getByTestId('chat-input')
    await user.type(input, 'Test question')
    
    const form = screen.getByTestId('chat-input-form')
    fireEvent.submit(form)

    const state = store.getState()
    expect(state.chat.isChatOpen).toBe(true)
  })

  it('should clear input after submission', async () => {
    const user = userEvent.setup()
    const store = createTestStore()
    
    render(
      <Provider store={store}>
        <ChatArea />
      </Provider>
    )

    const input = screen.getByTestId('chat-input')
    await user.type(input, 'Test question')
    expect(input).toHaveValue('Test question')
    
    const form = screen.getByTestId('chat-input-form')
    fireEvent.submit(form)

    expect(input).toHaveValue('')
  })

  it('should not submit empty questions', () => {
    const store = createTestStore()
    
    render(
      <Provider store={store}>
        <ChatArea />
      </Provider>
    )

    const form = screen.getByTestId('chat-input-form')
    fireEvent.submit(form)

    expect(mockPushAnalyticsEvent).not.toHaveBeenCalled()
    
    const state = store.getState()
    expect(state.chat.isChatOpen).toBe(false)
    expect(state.question.question).toBe('')
  })

  it('should not submit questions with only whitespace', async () => {
    const user = userEvent.setup()
    const store = createTestStore()
    
    render(
      <Provider store={store}>
        <ChatArea />
      </Provider>
    )

    const input = screen.getByTestId('chat-input')
    await user.type(input, '   ')
    
    const form = screen.getByTestId('chat-input-form')
    fireEvent.submit(form)

    expect(mockPushAnalyticsEvent).not.toHaveBeenCalled()
    
    const state = store.getState()
    expect(state.chat.isChatOpen).toBe(false)
    expect(state.question.question).toBe('')
  })

  it('should trim whitespace from questions', async () => {
    const user = userEvent.setup()
    const store = createTestStore()
    
    render(
      <Provider store={store}>
        <ChatArea />
      </Provider>
    )

    const input = screen.getByTestId('chat-input')
    await user.type(input, '  Test question with spaces  ')
    
    const form = screen.getByTestId('chat-input-form')
    fireEvent.submit(form)

    const state = store.getState()
    expect(state.question.question).toBe('Test question with spaces')
  })

  it('should render with homepage class when isHomePage is true', () => {
    const store = createTestStore()
    
    render(
      <Provider store={store}>
        <ChatArea isHomePage={true} />
      </Provider>
    )

    const container = screen.getByTestId('chat-input-form').closest('.chat-area-container')
    expect(container).toHaveClass('homepage')
  })

  it('should be disabled when chat is open', () => {
    const store = createTestStore()
    // Pre-open the chat
    store.dispatch({ type: 'chat/openChat' })
    
    render(
      <Provider store={store}>
        <ChatArea />
      </Provider>
    )

    const input = screen.getByTestId('chat-input')
    const button = screen.getByTestId('submit-button')
    
    expect(input).toBeDisabled()
    expect(button).toBeDisabled()
  })

  it('should have disabled class when chat is open', () => {
    const store = createTestStore()
    store.dispatch({ type: 'chat/openChat' })
    
    render(
      <Provider store={store}>
        <ChatArea />
      </Provider>
    )

    const container = screen.getByTestId('chat-input-form').closest('.chat-area-container')
    expect(container).toHaveClass('disabled')
  })

  it('should handle input change correctly', async () => {
    const user = userEvent.setup()
    const store = createTestStore()
    
    render(
      <Provider store={store}>
        <ChatArea />
      </Provider>
    )

    const input = screen.getByTestId('chat-input')
    await user.type(input, 'Typing test')
    
    expect(input).toHaveValue('Typing test')
  })
})