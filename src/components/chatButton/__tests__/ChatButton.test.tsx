import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import ChatButton from '../ChatButton'
import chatSlice from '@/store/slices/chatSlice'
import questionSlice from '@/store/slices/questionSlice'
import { pushAnalyticsEvent } from '@/lib/analytics'

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  pushAnalyticsEvent: vi.fn()
}))

// Mock useMobile hook
vi.mock('@/lib/useMobile', () => ({
  useMobile: vi.fn(() => false)
}))

// Mock Stars component
vi.mock('../Stars', () => ({
  default: ({ className }: { className: string }) => <div className={className} data-testid="stars-icon" />
}))

const mockPushAnalyticsEvent = vi.mocked(pushAnalyticsEvent)

const createTestStore = () => configureStore({
  reducer: {
    chat: chatSlice,
    question: questionSlice
  }
})

describe('ChatButton', () => {
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

  it('should render desktop button with description', () => {
    const store = createTestStore()
    
    render(
      <Provider store={store}>
        <ChatButton />
      </Provider>
    )

    expect(screen.getByText('Test chat description')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should render mobile button without description', async () => {
    const { useMobile } = await import('@/lib/useMobile')
    vi.mocked(useMobile).mockReturnValue(true)
    
    const store = createTestStore()
    
    render(
      <Provider store={store}>
        <ChatButton />
      </Provider>
    )

    expect(screen.queryByText('Test chat description')).not.toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should track analytics when button is clicked', () => {
    const store = createTestStore()
    
    render(
      <Provider store={store}>
        <ChatButton />
      </Provider>
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('opened', null, 'button')
    expect(mockPushAnalyticsEvent).toHaveBeenCalledTimes(1)
  })

  it('should dispatch openChat when clicked', () => {
    const store = createTestStore()
    
    render(
      <Provider store={store}>
        <ChatButton />
      </Provider>
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    const state = store.getState()
    expect(state.chat.isChatOpen).toBe(true)
  })

  it('should be disabled when chat is already open', () => {
    const store = createTestStore()
    // Pre-open the chat
    store.dispatch({ type: 'chat/openChat' })
    
    render(
      <Provider store={store}>
        <ChatButton />
      </Provider>
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should not track analytics when disabled button is clicked', () => {
    const store = createTestStore()
    // Pre-open the chat
    store.dispatch({ type: 'chat/openChat' })
    
    render(
      <Provider store={store}>
        <ChatButton />
      </Provider>
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockPushAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('should have correct CSS classes when disabled', () => {
    const store = createTestStore()
    store.dispatch({ type: 'chat/openChat' })
    
    render(
      <Provider store={store}>
        <ChatButton />
      </Provider>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveClass('chat-button-disabled')
  })

  it('should handle multiple clicks correctly', () => {
    const store = createTestStore()
    
    render(
      <Provider store={store}>
        <ChatButton />
      </Provider>
    )

    const button = screen.getByRole('button')
    
    // First click
    fireEvent.click(button)
    expect(mockPushAnalyticsEvent).toHaveBeenCalledTimes(1)
    expect(mockPushAnalyticsEvent).toHaveBeenLastCalledWith('opened', null, 'button')
    
    // Button should be disabled after first click
    expect(button).toBeDisabled()
    
    // Second click should not trigger analytics
    fireEvent.click(button)
    expect(mockPushAnalyticsEvent).toHaveBeenCalledTimes(1)
  })
})