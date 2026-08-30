"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { Banner } from "@/features/cms/api/banners";

/** Centered image popup shown once per session on page load. */
export function PopupBanner({ banner }: { banner: Banner }) {
  const [open, setOpen] = useState(false);
  const key = `banner-popup-dismissed-${banner.id}`;

  useEffect(() => {
    if (sessionStorage.getItem(key) !== "1") {
      // Small delay so it doesn't fight the initial paint.
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [key]);

  if (!open) return null;

  function close() {
    sessionStorage.setItem(key, "1");
    setOpen(false);
  }

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={banner.imageUrl}
      alt={banner.title}
      className="max-h-[80vh] w-auto max-w-full rounded-2xl shadow-2xl"
    />
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={close}
    >
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={close}
          aria-label="Close"
          className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow-lg hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>
        {banner.linkUrl ? (
          banner.openInNewTab ? (
            <a href={banner.linkUrl} target="_blank" rel="noreferrer" onClick={close}>{img}</a>
          ) : (
            <Link href={banner.linkUrl} onClick={close}>{img}</Link>
          )
        ) : (
          img
        )}
      </div>
    </div>
  );
}
