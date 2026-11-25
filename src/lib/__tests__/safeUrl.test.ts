import { safeHttpUrl } from '../safeUrl'

describe('safeHttpUrl', () => {
  it.each([
    'https://www.kolzchut.org.il/he/תנאי_שימוש',
    'http://example.org/page?x=1#y',
    'HTTPS://EXAMPLE.ORG/',
  ])('keeps the web URL %s', (url) => {
    expect(safeHttpUrl(url)).toBe(url)
  })

  it('trims surrounding whitespace', () => {
    expect(safeHttpUrl('  https://example.org/  ')).toBe('https://example.org/')
  })

  it.each([
    'javascript:alert(1)',
    ' JavaScript:alert(1)',
    'java\tscript:alert(1)',
    'data:text/html,<b>x</b>',
    'vbscript:msgbox(1)',
    'mailto:someone@example.org',
    '//example.org/protocol-relative',
    '/w/he/relative',
    'not a url',
    '',
    '   ',
  ])('drops %j', (url) => {
    expect(safeHttpUrl(url)).toBeUndefined()
  })

  it.each([undefined, null, 42, {}, ['https://example.org/']])('drops the non-string %j', (value) => {
    expect(safeHttpUrl(value)).toBeUndefined()
  })
})
