/**
 * Calculate reading time for HTML content.
 * Strips all HTML tags, counts meaningful words, divides by ~200 WPM.
 */
export function calculateReadingTime(html: string | null | undefined): number {
  if (!html) return 1;

  // Strip HTML tags
  const text = html.replace(/<[^>]*>/g, " ");
  // Decode common HTML entities
  const decoded = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
  // Collapse whitespace and count words
  const words = decoded.trim().split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;
  // 200 words per minute, minimum 1 minute
  return Math.max(1, Math.ceil(wordCount / 200));
}
