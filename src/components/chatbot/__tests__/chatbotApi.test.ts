import { describe, it, expect, vi, beforeEach } from 'vitest'
import { askQuestion } from '../chatbotApi'
import { HttpError } from '@/lib/HttpError'

const mockFetch = vi.mocked(global.fetch)

const htmlResponse = (status: number, statusText: string) =>
  new Response('<html><body>Bad Gateway</body></html>', {
    status,
    statusText,
    headers: { 'Content-Type': 'text/html' },
  })

describe('askQuestion', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('reports a non-JSON error page as the HTTP status it was', async () => {
    mockFetch.mockResolvedValueOnce(htmlResponse(502, 'Bad Gateway'))

    const error = await askQuestion(null, { text: 'q' }).catch((e) => e)

    expect(error).toBeInstanceOf(HttpError)
    expect(error.httpCode).toBe(502)
    expect(error.message).toBe('Bad Gateway')
  })

  it('still uses the server message from a JSON error body', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Daily limit reached' }), { status: 429 }),
    )

    const error = await askQuestion(null, { text: 'q' }).catch((e) => e)

    expect(error).toBeInstanceOf(HttpError)
    expect(error.httpCode).toBe(429)
    expect(error.message).toBe('Daily limit reached')
  })

  it('treats a success status with an unreadable body as a failure', async () => {
    mockFetch.mockResolvedValueOnce(htmlResponse(200, 'OK'))

    await expect(askQuestion(null, { text: 'q' })).rejects.toThrow('invalid_response_body')
  })
})
