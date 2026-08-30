import { RESERVED_FIRST_SEGMENTS } from "./reserved-paths.generated";

// System segments that aren't real pages but must never be claimed by a course
// (framework internals + the internal /c/<id> prefix used for course flows).
const SYSTEM_RESERVED = ["api", "_next", "c", "static", "assets", "favicon.ico", "robots.txt", "sitemap.xml"];

const RESERVED = new Set<string>([...RESERVED_FIRST_SEGMENTS, ...SYSTEM_RESERVED]);

export type PathCheckStatus = "available" | "reserved" | "taken" | "invalid" | "empty" | "checking";

export interface PathCheckResult {
  status: PathCheckStatus;
  message: string;
}

// One path segment: lowercase alphanumerics in hyphen-separated groups
// (no leading/trailing/double hyphen). Segments are joined by single slashes.
const PATH_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

/**
 * Synchronous format + reserved-word validation (no network). Returns null when
 * the format is valid and the path is free to check for uniqueness next.
 * Safe to run on the client for instant feedback.
 */
export function validatePathFormat(path: string): PathCheckResult | null {
  const p = (path ?? "").trim();
  if (!p) return { status: "empty", message: "Enter a URL path." };
  if (p.startsWith("/") || p.endsWith("/")) return { status: "invalid", message: "No leading or trailing slash." };
  if (p.includes("//")) return { status: "invalid", message: "No empty segments (//)." };
  if (!PATH_RE.test(p)) {
    return { status: "invalid", message: "Use lowercase letters, numbers, hyphens, and / between segments." };
  }
  const first = p.split("/")[0]!;
  if (RESERVED.has(first)) {
    return { status: "reserved", message: `“/${first}” is already used by a page — choose another path.` };
  }
  return null;
}
