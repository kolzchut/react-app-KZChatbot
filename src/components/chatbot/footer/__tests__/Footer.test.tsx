import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import Footer from '../Footer'
import { MessageType, Message } from '@/types'
import { pushAnalyticsEvent } from '@/lib/analytics'
import { TranslationProvider } from '@/contexts/TranslationContext'
import chatSlice from '@/store/slices/chatSlice'
import questionSlice from '@/store/slices/questionSlice'

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  pushAnalyticsEvent: vi.fn()
}))

// Mock useMobile hook
vi.mock('@/lib/useMobile', () => ({
  useMobile: vi.fn(() => false)
}))

// Mock child components
vi.mock('@/components/chatbot/newQuestion/NewQuestion.tsx', () => ({
  default: ({ onClick }: { onClick: () => void }) => (
    <button data-testid="new-question" onClick={onClick}>
      Ask New Question
    </button>
  )
}))

vi.mock('@/components/chatbot/chatInput/ChatInput.tsx', () => ({
  default: ({ 
    question, 
    handleSubmit, 
    handleOnMessageChange, 
    errors, 
    inputRef 
  }: {
    question: string
    handleSubmit: (e: React.FormEvent) => void
    handleOnMessageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    errors: { question?: string; description?: string }
    inputRef: React.RefObject<HTMLInputElement>
  }) => {
    // Just use the question prop directly - no internal state needed
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleOnMessageChange(e)
    }

    return (
      <form data-testid="chat-input-form" onSubmit={handleSubmit}>
        <input
          data-testid="chat-input"
          ref={inputRef}
          value={question}
          onChange={handleChange}
        />
        <button type="submit" data-testid="submit-button">Submit</button>
        {errors.question && <div data-testid="error-message">{errors.question}</div>}
      </form>
    )
  }
}))

const mockPushAnalyticsEvent = vi.mocked(pushAnalyticsEvent)
const { useMobile } = await import('@/lib/useMobile')
const mockUseMobile = vi.mocked(useMobile)

const createTestStore = (initialState?: Record<string, unknown>) => configureStore({
  reducer: {
    chat: chatSlice,
    question: questionSlice
  },
  preloadedState: initialState
})

const defaultProps = {
  isLoading: false,
  showInput: true,
  setShowInput: vi.fn(),
  globalConfigObject: {
    questionsPermitted: 5,
    questionCharacterLimit: 150,
    slugs: {
      question_character_limit: 'Character limit exceeded'
    }
  },
  errors: { description: '', question: '' },
  setErrors: vi.fn(),
  messages: [] as Message[],
  isChatOpen: true
}

const createMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'test-id',
  content: 'Test message',
  type: MessageType.User,
  ...overrides
})

const renderWithStore = (props: Partial<typeof defaultProps> = {}, storeState: Record<string, unknown> = {}) => {
  const store = createTestStore(storeState)
  return {
    ...render(
      <Provider store={store}>
        <TranslationProvider>
          <Footer {...defaultProps} {...props} />
        </TranslationProvider>
      </Provider>
    ),
    store
  }
}

describe('Footer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMobile.mockReturnValue(false)
    // Clear sessionStorage
    sessionStorage.clear()
    // Setup window.KZChatbotConfig for tests
    window.KZChatbotConfig = {
      ...window.KZChatbotConfig,
      questionsPermitted: 5,
      questionCharacterLimit: 150,
      slugs: {
        ...window.KZChatbotConfig?.slugs,
        question_character_limit: 'Character limit exceeded'
      }
    } as typeof window.KZChatbotConfig
  })

  describe('Rendering Conditions', () => {
    it('renders null when loading', () => {
      const { container } = renderWithStore({ isLoading: true })
      expect(container.firstChild).toBeNull()
    })

    it('renders null when questions not permitted', () => {
      const { container } = renderWithStore({ 
        globalConfigObject: { ...defaultProps.globalConfigObject, questionsPermitted: 0 } 
      })
      expect(container.firstChild).toBeNull()
    })

    it('renders ChatInput when showInput is true', () => {
      renderWithStore({ showInput: true })
      expect(screen.getByTestId('chat-input-form')).toBeInTheDocument()
      expect(screen.queryByTestId('new-question')).not.toBeInTheDocument()
    })

    it('renders NewQuestion when showInput is false', () => {
      renderWithStore({ showInput: false })
      expect(screen.getByTestId('new-question')).toBeInTheDocument()
      expect(screen.queryByTestId('chat-input-form')).not.toBeInTheDocument()
    })
  })

  describe('Input Focus Behavior', () => {
    it('focuses input when chat opens and showInput is true', async () => {
      const { rerender } = renderWithStore({ isChatOpen: false, showInput: true })
      
      // Re-render with chat open
      rerender(
        <Provider store={createTestStore()}>
          <TranslationProvider>
            <Footer {...defaultProps} isChatOpen={true} showInput={true} />
          </TranslationProvider>
        </Provider>
      )

      await waitFor(() => {
        const input = screen.getByTestId('chat-input')
        expect(document.activeElement).toBe(input)
      })
    })

    it('does not focus input on mobile when only startBot messages exist', () => {
      mockUseMobile.mockReturnValue(true)
      const messages = [createMessage({ type: MessageType.StartBot })]
      
      renderWithStore({ messages, isChatOpen: true, showInput: true })
      
      const input = screen.getByTestId('chat-input')
      expect(document.activeElement).not.toBe(input)
    })

    it('focuses input on mobile when non-startBot messages exist', async () => {
      mockUseMobile.mockReturnValue(true)
      const messages = [
        createMessage({ type: MessageType.StartBot }),
        createMessage({ type: MessageType.User })
      ]
      
      renderWithStore({ messages, isChatOpen: true, showInput: true })

      await waitFor(() => {
        const input = screen.getByTestId('chat-input')
        expect(document.activeElement).toBe(input)
      })
    })
  })

  describe('Local Question Management', () => {
    it('updates local question when typing', () => {
      const setErrors = vi.fn()
      renderWithStore({ setErrors })
      
      const input = screen.getByTestId('chat-input')
      
      act(() => {
        fireEvent.change(input, { target: { value: 'Test question' } })
      })
      
      // Test that the change handler was called (proves Footer received the input)
      expect(setErrors).toHaveBeenCalledWith(expect.any(Function))
      
      // Test that no error is set for valid input length
      const setErrorsCall = setErrors.mock.calls[0][0]
      const newErrors = setErrorsCall({ description: '' })
      expect(newErrors.question).toBe('')
    })

    it('clears local question when redux question is cleared', () => {
      const { store } = renderWithStore({}, { 
        question: { question: 'Initial question', source: null } 
      })
      
      const input = screen.getByTestId('chat-input')
      expect(input).toHaveValue('Initial question')
      
      // Clear redux question
      act(() => {
        store.dispatch({ type: 'question/resetQuestion' })
      })
      
      expect(input).toHaveValue('')
    })
  })

  describe('Character Limit Validation', () => {
    it('shows error when character limit is reached', () => {
      const setErrors = vi.fn()
      renderWithStore({ setErrors })
      
      const input = screen.getByTestId('chat-input')
      const longText = 'a'.repeat(151) // Exceeds limit of 150
      
      fireEvent.change(input, { target: { value: longText } })
      
      expect(setErrors).toHaveBeenCalledWith(expect.any(Function))
      const setErrorsCall = setErrors.mock.calls[0][0]
      const newErrors = setErrorsCall({ description: '' })
      expect(newErrors.question).toBe('Character limit exceeded')
    })

    it('clears error when under character limit', () => {
      const setErrors = vi.fn()
      renderWithStore({ setErrors })
      
      const input = screen.getByTestId('chat-input')
      const shortText = 'Short text'
      
      fireEvent.change(input, { target: { value: shortText } })
      
      expect(setErrors).toHaveBeenCalledWith(expect.any(Function))
      const setErrorsCall = setErrors.mock.calls[0][0]
      const newErrors = setErrorsCall({ description: '' })
      expect(newErrors.question).toBe('')
    })

    it('uses default character limit when not configured', () => {
      const setErrors = vi.fn()
      renderWithStore({ 
        setErrors,
        globalConfigObject: { ...defaultProps.globalConfigObject, questionCharacterLimit: undefined }
      })
      
      const input = screen.getByTestId('chat-input')
      const longText = 'a'.repeat(151) // Should exceed default limit of 150
      
      fireEvent.change(input, { target: { value: longText } })
      
      const setErrorsCall = setErrors.mock.calls[0][0]
      const newErrors = setErrorsCall({ description: '' })
      expect(newErrors.question).toBeTruthy()
    })
  })

  describe('Form Submission', () => {
    it('dispatches question and opens chat on form submit with valid input', () => {
      const { store } = renderWithStore()

      const input = screen.getByTestId('chat-input')
      const form = screen.getByTestId('chat-input-form')

      // Type a question
      act(() => {
        fireEvent.change(input, { target: { value: 'Test question' } })
      })

      // Submit form
      act(() => {
        fireEvent.submit(form)
      })

      // Verify question was dispatched to Redux with source 'popup'
      const state = store.getState()
      expect(state.question.question).toBe('Test question')
      expect(state.question.source).toBe('popup')
      expect(state.chat.isChatOpen).toBe(true)
    })

    it('trims whitespace from question on submit', () => {
      const { store } = renderWithStore()

      const input = screen.getByTestId('chat-input')
      const form = screen.getByTestId('chat-input-form')

      // Type whitespace text
      act(() => {
        fireEvent.change(input, { target: { value: '  Test question  ' } })
      })

      // Submit form
      act(() => {
        fireEvent.submit(form)
      })

      // Verify question was trimmed when dispatched to Redux
      const state = store.getState()
      expect(state.question.question).toBe('Test question')
    })

    it('does not submit empty question', () => {
      const { store } = renderWithStore()
      
      const input = screen.getByTestId('chat-input')
      const form = screen.getByTestId('chat-input-form')
      
      fireEvent.change(input, { target: { value: '   ' } })
      fireEvent.submit(form)
      
      const state = store.getState()
      expect(state.question.question).toBe('')
    })

    it('clears local question when redux question is reset after submission', () => {
      const { store } = renderWithStore()

      const input = screen.getByTestId('chat-input')
      const form = screen.getByTestId('chat-input-form')

      // Type and submit question
      act(() => {
        fireEvent.change(input, { target: { value: 'Test question' } })
      })

      act(() => {
        fireEvent.submit(form)
      })

      // After submission, Redux has the question
      expect(store.getState().question.question).toBe('Test question')

      // When Chatbot component processes the question, it resets Redux state
      // Simulate that by resetting the question
      act(() => {
        store.dispatch({ type: 'question/resetQuestion' })
      })

      // Now the input should be cleared
      expect(input).toHaveValue('')
    })
  })

  describe('Redux Question Syncing', () => {
    it('syncs input field when redux question changes', () => {
      const { store } = renderWithStore({}, {
        question: { question: '', source: null }
      })

      const input = screen.getByTestId('chat-input')
      expect(input).toHaveValue('')

      // Set question in redux
      act(() => {
        store.dispatch({
          type: 'question/setQuestion',
          payload: { text: 'Redux question', source: 'embed' }
        })
      })

      // Input should sync with Redux state
      expect(input).toHaveValue('Redux question')
    })

    it('allows typing in input field without interference from Redux sync', () => {
      renderWithStore({}, {
        question: { question: '', source: null }
      })

      const input = screen.getByTestId('chat-input')

      // Type multiple characters
      act(() => {
        fireEvent.change(input, { target: { value: 'T' } })
      })
      expect(input).toHaveValue('T')

      act(() => {
        fireEvent.change(input, { target: { value: 'Te' } })
      })
      expect(input).toHaveValue('Te')

      act(() => {
        fireEvent.change(input, { target: { value: 'Tes' } })
      })
      expect(input).toHaveValue('Tes')

      act(() => {
        fireEvent.change(input, { target: { value: 'Test' } })
      })
      expect(input).toHaveValue('Test')
    })
  })

  describe('NewQuestion Component Integration', () => {
    it('shows new question button and handles click', () => {
      const setShowInput = vi.fn()
      renderWithStore({ showInput: false, setShowInput })
      
      const newQuestionButton = screen.getByTestId('new-question')
      fireEvent.click(newQuestionButton)
      
      expect(setShowInput).toHaveBeenCalledWith(true)
      expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('restart_clicked')
    })
  })


  describe('Error Display', () => {
    it('displays character limit error in ChatInput', () => {
      const errors = { description: '', question: 'Character limit exceeded' }
      renderWithStore({ errors })
      
      expect(screen.getByTestId('error-message')).toHaveTextContent('Character limit exceeded')
    })
  })
})