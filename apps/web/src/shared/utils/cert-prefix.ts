/**
 * Mirrors apps/api/src/common/utils/cert-prefix.util.ts — derives the same
 * certificate-code prefix from the site name for display purposes (e.g. the
 * "e.g. LMS-A3F7B2D1E9C4" placeholder on the verify form).
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
