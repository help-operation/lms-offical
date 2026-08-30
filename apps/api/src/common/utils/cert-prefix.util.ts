/**
 * Derives a certificate-code prefix from the site name, e.g.
 * "Learning Management System" → "LMS", "Skillkoro" → "SKI".
 * Falls back to "CERT" when the name yields fewer than 2 letters/digits
 * (empty, punctuation-only, etc.) so codes stay collision-safe.
 */
export function deriveCertPrefix(siteName: string): string {
  const words = siteName.trim().split(/\s+/).filter(Boolean);

  let prefix = '';
  if (words.length > 1) {
    prefix = words.map((w) => w[0] ?? '').join('');
  } else if (words.length === 1) {
    prefix = (words[0] ?? '').slice(0, 4);
  }

  prefix = prefix.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
  return prefix.length >= 2 ? prefix : 'CERT';
}
