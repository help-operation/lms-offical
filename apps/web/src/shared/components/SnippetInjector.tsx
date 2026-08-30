"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// ─── Types (mirrors API response) ─────────────────────────────────────────────

type SnippetLocation = "head" | "body_start" | "body_end";
type SnippetScope    = "global" | "specific";

interface Snippet {
  id:        number;
  name:      string;
  code:      string;
  location:  SnippetLocation;
  scope:     SnippetScope;
  pages:     string[];
  isEnabled: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if this snippet should run on `pathname` */
function matchesPath(snippet: Snippet, pathname: string): boolean {
  if (snippet.scope === "global") return true;
  return snippet.pages.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/**
 * Injects a raw HTML string as live DOM nodes.
 * Unlike dangerouslySetInnerHTML on a <div>, this correctly executes <script> tags.
 */
function injectCode(html: string, container: HTMLElement) {
  // Parse the HTML string to get child nodes
  const template = document.createElement("template");
  template.innerHTML = html;
  const nodes = Array.from(template.content.childNodes);

  for (const node of nodes) {
    if (node.nodeName === "SCRIPT") {
      const orig = node as HTMLScriptElement;
      const script = document.createElement("script");
      // Copy attributes
      Array.from(orig.attributes).forEach((attr) => {
        script.setAttribute(attr.name, attr.value);
      });
      script.textContent = orig.textContent;
      container.appendChild(script);
    } else {
      container.appendChild(node.cloneNode(true));
    }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  snippets: Snippet[];
}

export function SnippetInjector({ snippets }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    if (!snippets || snippets.length === 0) return;

    const injected: HTMLElement[] = [];

    for (const snippet of snippets) {
      if (!snippet.isEnabled) continue;
      if (!matchesPath(snippet, pathname)) continue;

      const attr = `data-snippet-id="${snippet.id}"`;

      // Skip if already injected (e.g. on HMR or StrictMode double-effect)
      if (document.querySelector(`[data-snippet-id="${snippet.id}"]`)) continue;

      // Determine target element
      let target: HTMLElement | null = null;
      if (snippet.location === "head") {
        target = document.head;
      } else if (snippet.location === "body_start") {
        target = document.body.firstElementChild as HTMLElement | null ?? document.body;
      } else {
        target = document.body;
      }

      // Wrap in a marker span so we can track & clean up
      const wrapper = document.createElement("span");
      wrapper.setAttribute("data-snippet-id", snippet.id.toString());
      wrapper.style.display = "none";
      injectCode(snippet.code, wrapper);

      if (snippet.location === "body_start") {
        document.body.insertBefore(wrapper, document.body.firstChild);
      } else {
        target.appendChild(wrapper);
      }

      injected.push(wrapper);
    }

    // Cleanup when pathname changes or component unmounts
    return () => {
      injected.forEach((el) => el.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // This component renders nothing — it's a side-effect only component
  return null;
}
