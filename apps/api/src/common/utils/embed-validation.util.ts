import { BadRequestException } from '@nestjs/common';

// ── Allowed embed domains ─────────────────────────────────────────────────────

const ALLOWED_IFRAME_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'youtu.be',
  'player.vimeo.com',
  'vimeo.com',
  'www.facebook.com',
  'facebook.com',
  'web.facebook.com',
  'm.facebook.com',
]);

// ── YouTube URL patterns ──────────────────────────────────────────────────────

const YOUTUBE_REGEX =
  /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/;

// ── Vimeo URL patterns ────────────────────────────────────────────────────────

const VIMEO_REGEX =
  /^(?:https?:\/\/)?(?:www\.)?(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)/;

// ── Facebook URL patterns ─────────────────────────────────────────────────────

const FACEBOOK_VIDEO_REGEX =
  /^(?:https?:\/\/)?(?:www\.|m\.|web\.)?(?:facebook\.com\/(?:.*\/videos\/\d+|plugins\/video\.php\?.*href=.+)|fb\.com\/.*\/videos\/\d+)/;

// ── Public interface ───────────────────────────────────────────────────────────

export interface EmbedValidationResult {
  valid: boolean;
  embedUrl?: string;
  platform?: string;
  error?: string;
}

/**
 * Validate an embed URL. Returns the sanitized embed URL if valid.
 * Used by both frontend and backend to ensure only allowed embed URLs are stored.
 */
export function validateEmbedUrl(url: string): EmbedValidationResult {
  const trimmed = url.trim();

  // YouTube
  const ytMatch = trimmed.match(YOUTUBE_REGEX);
  if (ytMatch) {
    return {
      valid: true,
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
      platform: 'youtube',
    };
  }

  // Vimeo
  const vimeoMatch = trimmed.match(VIMEO_REGEX);
  if (vimeoMatch) {
    return {
      valid: true,
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      platform: 'vimeo',
    };
  }

  // Facebook
  const fbMatch = trimmed.match(FACEBOOK_VIDEO_REGEX);
  if (fbMatch) {
    const embedUrl = trimmed.includes('plugins/video.php')
      ? trimmed
      : `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(trimmed)}&show_text=false&width=560`;
    return {
      valid: true,
      embedUrl,
      platform: 'facebook',
    };
  }

  return {
    valid: false,
    error: 'URL not recognized. Supported: YouTube, Vimeo, Facebook video links.',
  };
}

/**
 * Validate a URL is from an allowed embed domain.
 * Used for HTML content sanitization.
 */
export function isAllowedEmbedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_IFRAME_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Validate all iframe src attributes in HTML content.
 * Throws BadRequestException if any disallowed embed URLs are found.
 */
export function validateEmbedUrlsInContent(html: string | null | undefined): void {
  if (!html) return;

  // Match all iframe src attributes
  const iframeSrcRegex = /<iframe[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = iframeSrcRegex.exec(html)) !== null) {
    const src = match[1];
    if (!isAllowedEmbedUrl(src)) {
      throw new BadRequestException(
        `Disallowed embed URL: ${src}. Only YouTube, Vimeo, and Facebook embeds are allowed.`,
      );
    }
  }
}
