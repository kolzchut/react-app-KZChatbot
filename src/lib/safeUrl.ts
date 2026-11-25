/**
 * Returns the URL when it is an absolute http(s) URL, and undefined otherwise.
 *
 * Link targets reach the chatbot from site settings and from the answer
 * service, and React renders any string as an href. Only web links are
 * rendered, so a value with another scheme, or one that does not parse, is
 * left out instead of being turned into a link.
 */
export function safeHttpUrl(url: unknown): string | undefined {
  if (typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (trimmed === '') return undefined;
  try {
    const { protocol } = new URL(trimmed);
    return protocol === 'http:' || protocol === 'https:' ? trimmed : undefined;
  } catch {
    return undefined;
  }
}
