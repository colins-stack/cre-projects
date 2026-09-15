// Lets people type "example.com" instead of requiring "https://example.com" —
// if there's no scheme (http:, mailto:, tel:, etc.), assume https.
export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
