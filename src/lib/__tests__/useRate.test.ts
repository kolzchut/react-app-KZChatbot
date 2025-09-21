import { renderHook, act } from '@testing-library/react'
import { useRate } from '../useRate'
import { pushAnalyticsEvent } from '../analytics'
import { Message, MessageType } from '@/types'

// Mock analytics
vi.mock('../analytics', () => ({
  pushAnalyticsEvent: vi.fn()
}))

const mockPushAnalyticsEvent = vi.mocked(pushAnalyticsEvent)
const mockFetch = vi.mocked(global.fetch)

const createMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'test-message-id',
  content: 'Test message content',
  type: MessageType.Bot,
  ...overrides
})

const defaultProps = {
  message: createMessage(),
  setMessages: vi.fn(),
  globalConfigObject: {
    restPath: 'https://api.example.com',
    feedbackCharacterLimit: 150,
    slugs: {
      feedback_character_limit: 'Feedback character limit exceeded'
    }
  },
  textareaRef: { current: null } as React.RefObject<HTMLTextAreaElement>,
  errors: { description: '' },
  setErrors: vi.fn(),
  initialErrors: { description: '' }
}

const mockTextareaRef = () => {
  const mockTextarea = {
    style: { height: '' },
    scrollHeight: 100
  } as HTMLTextAreaElement
  
  return { current: mockTextarea } as React.RefObject<HTMLTextAreaElement>
}

describe('useRate Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
    
    // Set test environment
    vi.stubEnv('MODE', 'test')
  })

  describe('Initial State', () => {
    it('initializes with correct default values', () => {
      const { result } = renderHook(() => useRate(defaultProps))

      expect(result.current.values).toEqual({ description: '' })
      expect(result.current.errors).toEqual({ description: '' })
      expect(result.current.isFeedbackSubmitted).toBe(false)
      expect(result.current.rateIsOpen).toBe(false)
      expect(result.current.isFormValid).toBe(false)
    })
  })

  describe('Form Validation', () => {
    it('returns isFormValid as false when description is empty', () => {
      const { result } = renderHook(() => useRate(defaultProps))
      expect(result.current.isFormValid).toBe(false)
    })

    it('returns isFormValid as true when description has content and no errors', () => {
      const { result } = renderHook(() => useRate(defaultProps))

      act(() => {
        result.current.handleChange({
          target: { name: 'description', value: 'Valid feedback' }
        } as React.ChangeEvent<HTMLTextAreaElement>)
      })

      expect(result.current.isFormValid).toBe(true)
    })

    it('returns isFormValid as false when there are errors', () => {
      const propsWithErrors = {
        ...defaultProps,
        errors: { description: 'Error message' }
      }
      const { result } = renderHook(() => useRate(propsWithErrors))

      act(() => {
        result.current.handleChange({
          target: { name: 'description', value: 'Valid feedback' }
        } as React.ChangeEvent<HTMLTextAreaElement>)
      })

      expect(result.current.isFormValid).toBe(false)
    })
  })

  describe('handleChange', () => {
    it('updates values when description changes', () => {
      const { result } = renderHook(() => useRate(defaultProps))

      act(() => {
        result.current.handleChange({
          target: { name: 'description', value: 'New feedback' }
        } as React.ChangeEvent<HTMLTextAreaElement>)
      })

      expect(result.current.values.description).toBe('New feedback')
    })

    it('validates character limit and sets error', () => {
      const setErrors = vi.fn()
      const props = { ...defaultProps, setErrors }
      const { result } = renderHook(() => useRate(props))

      const longText = 'a'.repeat(151) // Exceeds limit of 150
      act(() => {
        result.current.handleChange({
          target: { name: 'description', value: longText }
        } as React.ChangeEvent<HTMLTextAreaElement>)
      })

      expect(setErrors).toHaveBeenCalledWith(expect.any(Function))
      const setErrorsCall = setErrors.mock.calls[0][0]
      const newErrors = setErrorsCall({ description: '' })
      expect(newErrors.description).toBe('Feedback character limit exceeded')
    })

    it('clears error when under character limit', () => {
      const setErrors = vi.fn()
      const props = { ...defaultProps, setErrors }
      const { result } = renderHook(() => useRate(props))

      act(() => {
        result.current.handleChange({
          target: { name: 'description', value: 'Short text' }
        } as React.ChangeEvent<HTMLTextAreaElement>)
      })

      expect(setErrors).toHaveBeenCalledWith(expect.any(Function))
      const setErrorsCall = setErrors.mock.calls[0][0]
      const newErrors = setErrorsCall({ description: '' })
      expect(newErrors.description).toBe('')
    })

    it('auto-expands textarea when description changes', () => {
      const textareaRef = mockTextareaRef()
      const props = { ...defaultProps, textareaRef }
      const { result } = renderHook(() => useRate(props))

      act(() => {
        result.current.handleChange({
          target: { name: 'description', value: 'New feedback' }
        } as React.ChangeEvent<HTMLTextAreaElement>)
      })

      expect(textareaRef.current?.style.height).toBe('100px')
    })

    it('uses minimum height of 69px for textarea', () => {
      const textareaRef = {
        current: {
          style: { height: '' },
          scrollHeight: 50 // Less than minimum
        }
      } as React.RefObject<HTMLTextAreaElement>
      
      const props = { ...defaultProps, textareaRef }
      const { result } = renderHook(() => useRate(props))

      act(() => {
        result.current.handleChange({
          target: { name: 'description', value: 'Text' }
        } as React.ChangeEvent<HTMLTextAreaElement>)
      })

      expect(textareaRef.current?.style.height).toBe('69px')
    })

    it('handles null textareaRef gracefully', () => {
      const props = { 
        ...defaultProps, 
        textareaRef: { current: null } as React.RefObject<HTMLTextAreaElement> 
      }
      const { result } = renderHook(() => useRate(props))

      expect(() => {
        act(() => {
          result.current.handleChange({
            target: { name: 'description', value: 'Text' }
          } as React.ChangeEvent<HTMLTextAreaElement>)
        })
      }).not.toThrow()
    })
  })

  describe('handleSubmit', () => {
    const mockEvent = {
      preventDefault: vi.fn()
    } as unknown as React.FormEvent<HTMLFormElement>

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({})
      } as Response)
    })

    it('prevents default form submission', async () => {
      const { result } = renderHook(() => useRate(defaultProps))

      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })

      expect(mockEvent.preventDefault).toHaveBeenCalled()
    })

    it('sends feedback to correct API endpoint in test mode', async () => {
      const { result } = renderHook(() => useRate(defaultProps))

      // Set description
      act(() => {
        result.current.handleChange({
          target: { name: 'description', value: 'Test feedback' }
        } as React.ChangeEvent<HTMLTextAreaElement>)
      })

      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/kzchatbot/v0/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answerId: 'test-message-id',
          like: null,
          text: 'Test feedback'
        })
      })
    })

    it('sends feedback to correct API endpoint in production mode', async () => {
      vi.stubEnv('MODE', 'production')
      const { result } = renderHook(() => useRate(defaultProps))

      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/kzchatbot/v0/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answerId: 'test-message-id',
          like: null,
          text: ''
        })
      })
    })

    it('tracks analytics for free text feedback', async () => {
      const { result } = renderHook(() => useRate(defaultProps))

      // Set description
      act(() => {
        result.current.handleChange({
          target: { name: 'description', value: 'Test feedback' }
        } as React.ChangeEvent<HTMLTextAreaElement>)
      })

      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })

      expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('free_text_feedback')
    })

    it('does not track analytics for empty feedback', async () => {
      const { result } = renderHook(() => useRate(defaultProps))

      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })

      expect(mockPushAnalyticsEvent).not.toHaveBeenCalled()
    })

    it('resets form on successful submission', async () => {
      const setErrors = vi.fn()
      const props = { ...defaultProps, setErrors }
      const { result } = renderHook(() => useRate(props))

      // Set some values
      act(() => {
        result.current.handleChange({
          target: { name: 'description', value: 'Test feedback' }
        } as React.ChangeEvent<HTMLTextAreaElement>)
      })

      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })

      expect(result.current.values.description).toBe('')
      expect(result.current.isFeedbackSubmitted).toBe(true)
      expect(result.current.rateIsOpen).toBe(false)
      expect(setErrors).toHaveBeenCalledWith({ description: '' })
    })

    it('handles API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          messageTranslations: { he: 'Hebrew error message' }
        })
      } as Response)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { result } = renderHook(() => useRate(defaultProps))

      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })

      expect(result.current.isFeedbackSubmitted).toBe(false)
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { result } = renderHook(() => useRate(defaultProps))

      await act(async () => {
        await result.current.handleSubmit(mockEvent)
      })

      expect(result.current.isFeedbackSubmitted).toBe(false)
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('handleRate', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({})
      } as Response)
    })

    it('tracks positive feedback analytics', async () => {
      const { result } = renderHook(() => useRate(defaultProps))

      await act(async () => {
        await result.current.handleRate(true)
      })

      expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('positive_feedback')
    })

    it('tracks negative feedback analytics', async () => {
      const { result } = renderHook(() => useRate(defaultProps))

      await act(async () => {
        await result.current.handleRate(false)
      })

      expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('negative_feedback')
    })

    it('sends rating to API with correct data', async () => {
      const { result } = renderHook(() => useRate(defaultProps))

      await act(async () => {
        await result.current.handleRate(true)
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/kzchatbot/v0/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          like: true,
          answerId: 'test-message-id'
        })
      })
    })

    it('updates message in state on successful rating', async () => {
      const setMessages = vi.fn()
      const props = { ...defaultProps, setMessages }
      const { result } = renderHook(() => useRate(props))

      await act(async () => {
        await result.current.handleRate(true)
      })

      expect(setMessages).toHaveBeenCalledWith(expect.any(Function))
      
      // Test the state update function
      const updateFunction = setMessages.mock.calls[0][0]
      const currentMessages = [createMessage()]
      const updatedMessages = updateFunction(currentMessages)
      
      expect(updatedMessages[0].liked).toBe(true)
    })

    it('toggles rating when same rating is clicked', async () => {
      const setMessages = vi.fn()
      const message = createMessage({ liked: true })
      const props = { ...defaultProps, setMessages, message }
      const { result } = renderHook(() => useRate(props))

      await act(async () => {
        await result.current.handleRate(true)
      })

      const updateFunction = setMessages.mock.calls[0][0]
      const currentMessages = [message]
      const updatedMessages = updateFunction(currentMessages)
      
      expect(updatedMessages[0].liked).toBe(null)
    })

    it('updates only the correct message when multiple messages exist', async () => {
      const setMessages = vi.fn()
      const props = { ...defaultProps, setMessages }
      const { result } = renderHook(() => useRate(props))

      await act(async () => {
        await result.current.handleRate(true)
      })

      const updateFunction = setMessages.mock.calls[0][0]
      const currentMessages = [
        createMessage({ id: 'other-message' }),
        createMessage({ id: 'test-message-id' }),
        createMessage({ id: 'another-message' })
      ]
      const updatedMessages = updateFunction(currentMessages)
      
      expect(updatedMessages[0].liked).toBeUndefined()
      expect(updatedMessages[1].liked).toBe(true)
      expect(updatedMessages[2].liked).toBeUndefined()
    })

    it('resets form values on successful rating', async () => {
      const setErrors = vi.fn()
      const props = { ...defaultProps, setErrors }
      const { result } = renderHook(() => useRate(props))

      // Set some values first
      act(() => {
        result.current.handleChange({
          target: { name: 'description', value: 'Test feedback' }
        } as React.ChangeEvent<HTMLTextAreaElement>)
      })

      await act(async () => {
        await result.current.handleRate(true)
      })

      expect(result.current.values.description).toBe('')
      expect(setErrors).toHaveBeenCalledWith({ description: '' })
    })

    it('handles API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          messageTranslations: { he: 'Hebrew error message' }
        })
      } as Response)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { result } = renderHook(() => useRate(defaultProps))

      await act(async () => {
        await result.current.handleRate(true)
      })

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('rateIsOpen state management', () => {
    it('allows setting rateIsOpen', () => {
      const { result } = renderHook(() => useRate(defaultProps))

      act(() => {
        result.current.setRateIsOpen(true)
      })

      expect(result.current.rateIsOpen).toBe(true)

      act(() => {
        result.current.setRateIsOpen(false)
      })

      expect(result.current.rateIsOpen).toBe(false)
    })
  })

  describe('Configuration handling', () => {
    it('uses default character limit when not configured', () => {
      const setErrors = vi.fn()
      const propsWithoutLimit = {
        ...defaultProps,
        setErrors,
        globalConfigObject: {
          ...defaultProps.globalConfigObject,
          feedbackCharacterLimit: undefined
        }
      }
      const { result } = renderHook(() => useRate(propsWithoutLimit))

      const longText = 'a'.repeat(151) // Should exceed default limit of 150
      act(() => {
        result.current.handleChange({
          target: { name: 'description', value: longText }
        } as React.ChangeEvent<HTMLTextAreaElement>)
      })

      const setErrorsCall = setErrors.mock.calls[0][0]
      const newErrors = setErrorsCall({ description: '' })
      expect(newErrors.description).toBeTruthy()
    })

    it('uses default error message when slug not configured', () => {
      const setErrors = vi.fn()
      const propsWithoutSlug = {
        ...defaultProps,
        setErrors,
        globalConfigObject: {
          ...defaultProps.globalConfigObject,
          slugs: {}
        }
      }
      const { result } = renderHook(() => useRate(propsWithoutSlug))

      const longText = 'a'.repeat(151)
      act(() => {
        result.current.handleChange({
          target: { name: 'description', value: longText }
        } as React.ChangeEvent<HTMLTextAreaElement>)
      })

      const setErrorsCall = setErrors.mock.calls[0][0]
      const newErrors = setErrorsCall({ description: '' })
      expect(newErrors.description).toBe('')
    })
  })
})