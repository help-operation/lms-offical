"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const MOBILE_WIDTH = 390;

/**
 * Renders children inside a real iframe so Tailwind's viewport-based
 * responsive classes (sm:, md:, lg:) evaluate against a genuine mobile
 * width instead of the admin app's actual (desktop) browser width —
 * simply narrowing a <div> doesn't change what those media queries see.
 */
export function MobilePreviewFrame({ children }: { children: ReactNode }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    function setup() {
      const doc = iframe!.contentDocument;
      if (!doc) return;

      doc.head.innerHTML = "";
      document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
        doc.head.appendChild(node.cloneNode(true));
      });

      doc.body.style.margin = "0";
      setMountNode(doc.body);
    }

    iframe.addEventListener("load", setup);
    if (iframe.contentDocument?.readyState === "complete") setup();
    return () => iframe.removeEventListener("load", setup);
  }, []);

  return (
    <div className="mx-auto my-4 overflow-hidden rounded-2xl border border-gray-200 shadow-sm" style={{ width: MOBILE_WIDTH }}>
      <iframe
        ref={iframeRef}
        src="about:blank"
        title="Mobile preview"
        style={{ width: MOBILE_WIDTH, height: "calc(100vh - 220px)", border: "none", display: "block" }}
      />
      {mountNode && createPortal(children, mountNode)}
    </div>
  );
}
