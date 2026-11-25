import { render, screen } from '@testing-library/react'
import DisclaimerActions from '../DisclaimerActions'
import { TranslationProvider } from '@/contexts/TranslationContext'

vi.mock('@/lib/analytics', () => ({
  pushAnalyticsEvent: vi.fn()
}))

const renderActions = (termsofServiceUrl?: string) =>
  render(
    <TranslationProvider>
      <DisclaimerActions termsofServiceUrl={termsofServiceUrl} />
    </TranslationProvider>
  )

describe('DisclaimerActions terms-of-service link', () => {
  it('links to an https terms-of-service URL', () => {
    renderActions('https://www.kolzchut.org.il/he/terms')
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://www.kolzchut.org.il/he/terms')
  })

  it.each([
    'javascript:alert(1)',
    'data:text/html,x',
    '/relative/path',
    '',
    undefined,
  ])('renders no link for %j', (url) => {
    renderActions(url)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
