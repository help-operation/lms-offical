"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { Banner } from "@/features/cms/api/banners";

/** Full-width dismissible image strip under the header. Once per session. */
export function TopStripBanner({ banner }: { banner: Banner }) {
  const [visible, setVisible] = useState(false);
  const key = `banner-strip-dismissed-${banner.id}`;

  useEffect(() => {
    if (sessionStorage.getItem(key) !== "1") setVisible(true);
  }, [key]);

  if (!visible) return null;

  function dismiss() {
    sessionStorage.setItem(key, "1");
    setVisible(false);
  }

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={banner.imageUrl} alt={banner.title} className="h-auto w-full object-cover" />
  );

  return (
    <div className="relative w-full">
      {banner.linkUrl ? (
        banner.openInNewTab ? (
          <a href={banner.linkUrl} target="_blank" rel="noreferrer" className="block">{img}</a>
        ) : (
          <Link href={banner.linkUrl} className="block">{img}</Link>
        )
      ) : (
        img
      )}
      <button
        onClick={dismiss}
        aria-label="Dismiss banner"
        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
