import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Messages from '../Messages'
import { MessageType, Message } from '@/types'
import { pushAnalyticsEvent } from '@/lib/analytics'
import { TranslationProvider } from '@/contexts/TranslationContext'

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  pushAnalyticsEvent: vi.fn()
}))

// Mock child components
vi.mock('../Rate', () => ({
  default: ({ message }: { message: Message }) => (
    <div data-testid={`rate-${message.id}`}>Rate Component</div>
  )
}))

vi.mock('@/components/chatbot/typingIndicator/TypingIndicator.tsx', () => ({
  default: () => <div data-testid="typing-indicator">Typing...</div>
}))

// Mock react-markdown
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => (
    <div data-testid="markdown-content">{children}</div>
  )
}))

// Mock SVG assets
vi.mock('@/assets/link.svg', () => ({ default: 'link-icon.svg' }))
vi.mock('@/assets/alert.svg', () => ({ default: 'alert-icon.svg' }))
vi.mock('@/assets/purple-stars.svg', () => ({ default: 'stars-icon.svg' }))

const mockPushAnalyticsEvent = vi.mocked(pushAnalyticsEvent)

const mockGlobalConfig = {
  slugs: {
    returning_links_title: 'התשובה מבוססת AI. יש לבדוק את המידע המלא בדפים הבאים:',
    returning_links_no_links: 'התשובה מבוססת AI. יש לבדוק את המידע המלא באתר.'
  }
} as typeof window.KZChatbotConfig

const defaultProps = {
  messages: [],
  setMessages: vi.fn(),
  isLoading: false,
  globalConfigObject: mockGlobalConfig,
  errors: { description: '' },
  setErrors: vi.fn(),
  initialErrors: { description: '' }
}

const createMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'test-id',
  content: 'Test message',
  type: MessageType.User,
  ...overrides
})

const renderWithProviders = (component: React.ReactElement) => {
  return render(<TranslationProvider>{component}</TranslationProvider>)
}

describe('Messages Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders null when messages is falsy', () => {
      const { container } = renderWithProviders(
        <Messages {...defaultProps} messages={null as Message[]} />
      )
      expect(container.firstChild).toBeNull()
    })

    it('renders chat container with ref', () => {
      const ref = React.createRef<HTMLDivElement>()
      renderWithProviders(<Messages {...defaultProps} ref={ref} />)
      
      expect(document.querySelector('.chat-container')).toBeInTheDocument()
      expect(ref.current).toBeTruthy()
      expect(ref.current).toHaveClass('chat-container')
    })

    it('renders flex spacer', () => {
      renderWithProviders(<Messages {...defaultProps} />)
      expect(document.querySelector('.flex-spacer')).toBeInTheDocument()
    })

    it('filters out messages without content', () => {
      const messages = [
        createMessage({ id: '1', content: 'Valid message' }),
        createMessage({ id: '2', content: '' }),
        createMessage({ id: '3', content: '' })
      ]
      
      renderWithProviders(<Messages {...defaultProps} messages={messages} />)
      
      // Only one message should be rendered  
      expect(screen.getByText('Valid message')).toBeInTheDocument()
      // Check that messages with empty content are filtered out
      const emptyMessages = screen.queryAllByText((content, element) => {
        return element?.className?.includes('message-') && content.trim() === ''
      })
      expect(emptyMessages.length).toBe(0)
    })
  })

  describe('User Messages', () => {
    it('renders user message with correct styling', () => {
      const message = createMessage({ 
        type: MessageType.User, 
        content: 'User question' 
      })
      
      renderWithProviders(<Messages {...defaultProps} messages={[message]} />)
      
      const messageElement = screen.getByText('User question')
      expect(messageElement).toHaveClass('message-user-block')
    })

    it('renders multiple user messages', () => {
      const messages = [
        createMessage({ id: '1', content: 'First question', type: MessageType.User }),
        createMessage({ id: '2', content: 'Second question', type: MessageType.User })
      ]
      
      renderWithProviders(<Messages {...defaultProps} messages={messages} />)
      
      expect(screen.getByText('First question')).toBeInTheDocument()
      expect(screen.getByText('Second question')).toBeInTheDocument()
    })
  })

  describe('Bot Messages', () => {
    it('renders bot message with avatar and markdown', () => {
      const message = createMessage({
        type: MessageType.Bot,
        content: '**Bold** response with markdown'
      })
      
      renderWithProviders(<Messages {...defaultProps} messages={[message]} />)
      
      // Check bot avatar
      expect(screen.getByAltText('Bot Avatar')).toBeInTheDocument()
      expect(screen.getByAltText('Bot Avatar')).toHaveAttribute('src', 'stars-icon.svg')
      
      // Check markdown content
      expect(screen.getByTestId('markdown-content')).toHaveTextContent('**Bold** response with markdown')
      
      // Check styling - the markdown content is inside the message-bot-block div
      const markdownContent = screen.getByTestId('markdown-content')
      expect(markdownContent.parentElement).toHaveClass('message-bot-block')
    })

    it('renders AI disclaimer with links text when links are present', () => {
      const message = createMessage({
        type: MessageType.Bot,
        links: [{ url: 'https://example.com', title: 'Test Link' }]
      })

      renderWithProviders(<Messages {...defaultProps} messages={[message]} />)

      expect(screen.getByText('התשובה מבוססת AI. יש לבדוק את המידע המלא בדפים הבאים:')).toBeInTheDocument()
    })

    it('renders AI disclaimer with no-links text when no links', () => {
      const message = createMessage({ type: MessageType.Bot, links: [] })

      renderWithProviders(<Messages {...defaultProps} messages={[message]} />)

      expect(screen.getByText('התשובה מבוססת AI. יש לבדוק את המידע המלא באתר.')).toBeInTheDocument()
      expect(screen.queryByText('התשובה מבוססת AI. יש לבדוק את המידע המלא בדפים הבאים:')).not.toBeInTheDocument()
    })

    it('renders Rate component for bot messages', () => {
      const message = createMessage({ type: MessageType.Bot, id: 'bot-123' })
      
      renderWithProviders(<Messages {...defaultProps} messages={[message]} />)
      
      expect(screen.getByTestId('rate-bot-123')).toBeInTheDocument()
    })
  })

  describe('StartBot Messages', () => {
    it('renders StartBot message with bot styling but no disclaimer or rate', () => {
      const message = createMessage({
        type: MessageType.StartBot,
        content: 'Welcome message'
      })
      
      renderWithProviders(<Messages {...defaultProps} messages={[message]} />)
      
      // Should have bot avatar and styling
      expect(screen.getByAltText('Bot Avatar')).toBeInTheDocument()
      // For non-Bot messages, content is rendered as plain text, not markdown
      const messageContent = screen.getByText('Welcome message')
      expect(messageContent).toHaveClass('message-bot-block')
      
      // Should NOT have disclaimer or rate
      expect(screen.queryByText(/התשובה מבוססת AI/)).not.toBeInTheDocument()
      expect(screen.queryByTestId(/rate-/)).not.toBeInTheDocument()
    })
  })

  describe('Warning Messages', () => {
    it('renders warning message with bot styling but no disclaimer or rate', () => {
      const message = createMessage({
        type: MessageType.Warning,
        content: 'Warning message'
      })
      
      renderWithProviders(<Messages {...defaultProps} messages={[message]} />)
      
      // Should have bot avatar and styling
      expect(screen.getByAltText('Bot Avatar')).toBeInTheDocument()
      const messageContent = screen.getByText('Warning message')
      expect(messageContent).toHaveClass('message-bot-block')
      
      // Should NOT have disclaimer or rate
      expect(screen.queryByText(/התשובה מבוססת AI/)).not.toBeInTheDocument()
      expect(screen.queryByTestId(/rate-/)).not.toBeInTheDocument()
    })
  })

  describe('Error Messages', () => {
    it('renders error message with alert icon and correct styling', () => {
      const message = createMessage({
        type: MessageType.Error,
        content: 'Something went wrong'
      })
      
      renderWithProviders(<Messages {...defaultProps} messages={[message]} />)
      
      // Check error styling
      const messageContent = screen.getByText('Something went wrong')
      expect(messageContent).toHaveClass('message-error')
      
      // Check alert icon
      expect(screen.getByAltText('Alert Icon')).toBeInTheDocument()
      expect(screen.getByAltText('Alert Icon')).toHaveAttribute('src', 'alert-icon.svg')
      expect(screen.getByAltText('Alert Icon')).toHaveClass('message-error-icon')
      
      // Should NOT have disclaimer or rate
      expect(screen.queryByText(/התשובה מבוססת AI/)).not.toBeInTheDocument()
      expect(screen.queryByTestId(/rate-/)).not.toBeInTheDocument()
    })
  })

  describe('Links Handling', () => {
    it('renders links for bot messages with analytics tracking', () => {
      const message = createMessage({
        type: MessageType.Bot,
        links: [
          { url: 'https://example1.com', title: 'First Link' },
          { url: 'https://example2.com', title: 'Second Link' }
        ]
      })
      
      renderWithProviders(<Messages {...defaultProps} messages={[message]} />)
      
      // Check links container
      expect(screen.getByText('First Link')).toBeInTheDocument()
      expect(screen.getByText('Second Link')).toBeInTheDocument()
      
      // Check link attributes
      const firstLink = screen.getByText('First Link').closest('a')
      expect(firstLink).toHaveAttribute('href', 'https://example1.com')
      expect(firstLink).toHaveAttribute('target', '_blank')
      expect(firstLink).toHaveClass('link-card')
      
      // Check link icons
      const linkIcons = screen.getAllByAltText('Link Icon')
      expect(linkIcons).toHaveLength(2)
      linkIcons.forEach(icon => {
        expect(icon).toHaveAttribute('src', 'link-icon.svg')
        expect(icon).toHaveClass('link-icon')
      })
    })

    it('tracks analytics when link is clicked', () => {
      const message = createMessage({
        type: MessageType.Bot,
        links: [{ url: 'https://example.com', title: 'Test Link' }]
      })
      
      renderWithProviders(<Messages {...defaultProps} messages={[message]} />)
      
      const link = screen.getByText('Test Link')
      fireEvent.click(link)
      
      expect(mockPushAnalyticsEvent).toHaveBeenCalledWith('link_clicked', 'Test Link')
    })

    it('does not render links container when no links', () => {
      const message = createMessage({
        type: MessageType.Bot,
        links: []
      })
      
      renderWithProviders(<Messages {...defaultProps} messages={[message]} />)
      
      expect(screen.queryByText('Link Icon')).not.toBeInTheDocument()
    })

    it('does not render links container when links is undefined', () => {
      const message = createMessage({
        type: MessageType.Bot,
        links: undefined
      })
      
      renderWithProviders(<Messages {...defaultProps} messages={[message]} />)
      
      expect(screen.queryByText('Link Icon')).not.toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('shows typing indicator when loading', () => {
      renderWithProviders(<Messages {...defaultProps} isLoading={true} />)
      
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
    })

    it('does not show typing indicator when not loading', () => {
      renderWithProviders(<Messages {...defaultProps} isLoading={false} />)
      
      expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument()
    })

    it('shows typing indicator with existing messages', () => {
      const messages = [createMessage({ content: 'Existing message' })]
      
      renderWithProviders(<Messages {...defaultProps} messages={messages} isLoading={true} />)
      
      expect(screen.getByText('Existing message')).toBeInTheDocument()
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
    })
  })

  describe('Mixed Message Types', () => {
    it('renders different message types correctly in sequence', () => {
      const messages = [
        createMessage({ id: '1', type: MessageType.StartBot, content: 'Welcome!' }),
        createMessage({ id: '2', type: MessageType.User, content: 'User question' }),
        createMessage({ id: '3', type: MessageType.Bot, content: 'Bot response' }),
        createMessage({ id: '4', type: MessageType.Warning, content: 'Warning message' }),
        createMessage({ id: '5', type: MessageType.Error, content: 'Error message' })
      ]
      
      renderWithProviders(<Messages {...defaultProps} messages={messages} />)
      
      // All messages should be present
      expect(screen.getByText('Welcome!')).toBeInTheDocument()
      expect(screen.getByText('User question')).toBeInTheDocument()
      expect(screen.getByText('Bot response')).toBeInTheDocument()
      expect(screen.getByText('Warning message')).toBeInTheDocument()
      expect(screen.getByText('Error message')).toBeInTheDocument()
      
      // Check specific styling and components
      expect(screen.getByText('User question')).toHaveClass('message-user-block')
      expect(screen.getByText('Error message')).toHaveClass('message-error')
      expect(screen.getAllByAltText('Bot Avatar')).toHaveLength(4) // StartBot, Bot, Warning, Error
      expect(screen.getByAltText('Alert Icon')).toBeInTheDocument() // Error only
      expect(screen.getByTestId('rate-3')).toBeInTheDocument() // Only Bot message gets rate
    })
  })

  describe('getMessageClasses function', () => {
    it('returns correct classes for different message types', () => {
      const messages = [
        createMessage({ id: 'bot-1', type: MessageType.Bot }),
        createMessage({ id: 'start-1', type: MessageType.StartBot }),
        createMessage({ id: 'warn-1', type: MessageType.Warning }),
        createMessage({ id: 'user-1', type: MessageType.User }),
        createMessage({ id: 'error-1', type: MessageType.Error })
      ]
      
      renderWithProviders(<Messages {...defaultProps} messages={messages} />)
      
      // Find elements by their content and check classes
      const botMessages = document.querySelectorAll('.message-bot-block')
      const userMessages = document.querySelectorAll('.message-user-block')
      const errorMessages = document.querySelectorAll('.message-error')
      
      expect(botMessages).toHaveLength(3) // Bot, StartBot, Warning
      expect(userMessages).toHaveLength(1) // User
      expect(errorMessages).toHaveLength(1) // Error
    })
  })
})