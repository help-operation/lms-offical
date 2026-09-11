import DOMPurify from "isomorphic-dompurify";

// ── Allowed iframe domains ─────────────────────────────────────────────────────

const ALLOWED_IFRAME_HOSTS = [
  "www.youtube.com",
  "youtube.com",
  "youtu.be",
  "player.vimeo.com",
  "vimeo.com",
  "www.facebook.com",
  "facebook.com",
  "web.facebook.com",
  "m.facebook.com",
];

function isAllowedIframeHost(src: string): boolean {
  try {
    const url = new URL(src);
    return ALLOWED_IFRAME_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

// ── DOMPurify config ───────────────────────────────────────────────────────────

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "p", "br", "strong", "em", "u", "s", "code", "pre", "blockquote",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li",
    "img", "iframe",
    "a",
    "div", "span", "hr",
    "figure", "figcaption",
  ],
  ALLOWED_ATTR: [
    "href", "target", "rel", "title", "alt", "src", "width", "height",
    "class", "id", "style",
    "frameborder", "allowfullscreen", "allow", "referrerpolicy",
    "loading", "decoding",
  ],
  ALLOW_DATA_ATTR: false,
};

// ── Post-processing: strip disallowed iframes ──────────────────────────────────

function stripDisallowedIframes(html: string): string {
  if (typeof DOMParser === "undefined") return html;

  const doc = new DOMParser().parseFromString(html, "text/html");
  const iframes = doc.querySelectorAll("iframe");

  iframes.forEach((iframe) => {
    const src = iframe.getAttribute("src") ?? "";
    if (!isAllowedIframeHost(src)) {
      iframe.remove();
    } else {
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("allowfullscreen", "true");
      iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
      iframe.removeAttribute("onload");
      iframe.removeAttribute("onerror");
      iframe.removeAttribute("onmouseover");
      iframe.removeAttribute("javascript");
      for (const attr of Array.from(iframe.attributes)) {
        if (attr.name.startsWith("on")) {
          iframe.removeAttribute(attr.name);
        }
      }
    }
  });

  return doc.body.innerHTML;
}

// ── Main sanitize function ─────────────────────────────────────────────────────

export function sanitizeBlogContent(html: string | null | undefined): string {
  if (!html) return "";

  let clean: string = "";
  try {
    clean = DOMPurify.sanitize(html, SANITIZE_CONFIG) as unknown as string;
  } catch {
    clean = html;
  }

  clean = stripDisallowedIframes(clean);
  return clean;
}

export function sanitizeRichContent(html: string | null | undefined): string {
  if (!html) return "";
  try {
    return DOMPurify.sanitize(html, SANITIZE_CONFIG) as unknown as string;
  } catch {
    return html;
  }
}
