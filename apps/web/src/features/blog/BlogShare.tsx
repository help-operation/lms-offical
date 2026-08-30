"use client";

import { useState } from "react";
import { Link2, Check, Share2 } from "lucide-react";

// X/Twitter icon (not in lucide-react as of v0.4xx)
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

interface Props {
  title: string;
  slug: string;
  postId: number;
}

export function BlogShare({ title, slug, postId }: Props) {
  const [copied, setCopied] = useState(false);

  function trackShare() {
    fetch(`${API_URL}/blog/${postId}/share`, { method: "POST" }).catch(() => {});
  }

  const url = typeof window !== "undefined"
    ? `${window.location.origin}/blog/${slug}`
    : `/blog/${slug}`;

  const encodedUrl   = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      label: "X / Twitter",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: <XIcon className="h-4 w-4" />,
      color: "hover:text-black hover:border-black dark:hover:text-white dark:hover:border-white",
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: <FacebookIcon className="h-4 w-4" />,
      color: "hover:text-blue-600 hover:border-blue-600 dark:hover:text-blue-400 dark:hover:border-blue-400",
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
      icon: <LinkedInIcon className="h-4 w-4" />,
      color: "hover:text-blue-700 hover:border-blue-700 dark:hover:text-blue-400 dark:hover:border-blue-400",
    },
  ];

  async function handleCopy() {
    trackShare();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleNativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      // User cancelled or API not supported — fall back to copy
      handleCopy();
    }
  }

  const hasNativeShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-500 mr-1 dark:text-gray-400">Share:</span>

      {/* Social share links */}
      {shareLinks.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          title={`Share on ${s.label}`}
          onClick={trackShare}
          className={`flex items-center justify-center h-9 w-9 rounded-full border-2 border-gray-200 text-gray-400 transition-all dark:border-gray-700 dark:text-gray-500 ${s.color}`}
        >
          {s.icon}
        </a>
      ))}

      {/* Copy link */}
      <button
        onClick={handleCopy}
        title="Copy link"
        className={`flex items-center gap-1.5 h-9 px-3 rounded-full border-2 text-sm font-medium transition-all
          ${copied
            ? "border-brand-400 bg-brand-50 text-brand-600 dark:border-brand-500/50 dark:bg-brand-500/15 dark:text-brand-400"
            : "border-gray-200 text-gray-400 hover:border-brand-400 hover:text-brand-600 dark:border-gray-700 dark:text-gray-500 dark:hover:border-brand-500/50 dark:hover:text-brand-400"
          }`}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
        {copied ? "Copied!" : "Copy"}
      </button>

      {/* Native share (mobile) */}
      {hasNativeShare && (
        <button
          onClick={handleNativeShare}
          title="Share"
          className="flex items-center justify-center h-9 w-9 rounded-full border-2 border-gray-200 text-gray-400 hover:border-brand-400 hover:text-brand-600 transition-all dark:border-gray-700 dark:text-gray-500 dark:hover:border-brand-500/50 dark:hover:text-brand-400"
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
