/**
 * SMS segment calculator — detects GSM-7 vs Unicode and counts segments.
 *
 * GSM-7 basic charset: @£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ ÆæßÉ !"#%&'()*+,-./0123456789:;<=>? ¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà
 * GSM-7 extension:     ^{}\[~]|€
 *
 * Any character outside GSM-7 forces the entire message into UCS-2 (Unicode).
 */

const GSM7_BASIC = new Set(
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ ÆæßÉ !\"#%&'()*+,-./0123456789:;<=>? ¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà".split(""),
);

const GSM7_EXTENSION = new Set("^{}[~]|€".split(""));

const GSM7_SINGLE = 160;
const GSM7_SEGMENT = 153; // subsequent segments lose 7 chars to UDH header
const UCS2_SINGLE = 70;
const UCS2_SEGMENT = 66;

export type SmsInfo = {
  encoding: "gsm7" | "unicode";
  charCount: number;
  segments: number;
  charsPerSegment: number;
  maxChars: number;
};

export function detectEncoding(text: string): "gsm7" | "unicode" {
  for (const ch of text) {
    if (!GSM7_BASIC.has(ch) && !GSM7_EXTENSION.has(ch)) return "unicode";
  }
  return "gsm7";
}

export function countSegments(text: string): SmsInfo {
  if (text.length === 0) {
    return { encoding: "gsm7", charCount: 0, segments: 0, charsPerSegment: GSM7_SINGLE, maxChars: GSM7_SINGLE };
  }

  const encoding = detectEncoding(text);
  const len = text.length;

  if (encoding === "gsm7") {
    if (len <= GSM7_SINGLE) {
      return { encoding, charCount: len, segments: 1, charsPerSegment: GSM7_SINGLE, maxChars: GSM7_SINGLE };
    }
    const segments = Math.ceil(len / GSM7_SEGMENT);
    return { encoding, charCount: len, segments, charsPerSegment: GSM7_SEGMENT, maxChars: GSM7_SINGLE + (segments - 1) * GSM7_SEGMENT };
  }

  // Unicode / UCS-2
  if (len <= UCS2_SINGLE) {
    return { encoding, charCount: len, segments: 1, charsPerSegment: UCS2_SINGLE, maxChars: UCS2_SINGLE };
  }
  const segments = Math.ceil(len / UCS2_SEGMENT);
  return { encoding, charCount: len, segments, charsPerSegment: UCS2_SEGMENT, maxChars: UCS2_SINGLE + (segments - 1) * UCS2_SEGMENT };
}

/** Weighted length for Bengali/ASCII mixed content (legacy compat). */
export function weightedLength(text: string): number {
  let w = 0;
  for (const ch of text) {
    w += /[\u0980-\u09FF]/.test(ch) ? 2 : 1;
  }
  return w;
}

export function weightedSegments(text: string): number {
  const wLen = weightedLength(text);
  if (wLen <= 153) return 1;
  return Math.ceil(wLen / 153);
}
