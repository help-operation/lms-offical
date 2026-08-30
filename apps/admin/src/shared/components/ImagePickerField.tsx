"use client";

import { useState } from "react";
import { ImageIcon, FileText } from "lucide-react";
import { MediaLibraryModal } from "@/features/media/components/MediaLibraryModal";
import type { MediaType } from "@/features/media/types";

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
  previewClassName?: string;
  /** Media type the library picker filters to. Defaults to "image". */
  filterType?: MediaType;
}

/**
 * Shared media field: MediaLibrary picker button + manual URL text input.
 * No direct file upload — all files must come from the media library or a URL.
 * Non-image types (e.g. "document") show a file chip instead of an <img> preview.
 */
export function ImagePickerField({
  value,
  onChange,
  label,
  hint,
  placeholder = "https://example.com/image.jpg",
  disabled = false,
  previewClassName = "w-full h-28 object-cover rounded-lg border border-gray-100 mt-2",
  filterType = "image",
}: Props) {
  const [open, setOpen] = useState(false);
  const isImageType = filterType === "image";

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium capitalize text-gray-500 dark:text-gray-400">
          {label}
        </label>
      )}

      <div className="flex gap-2">
        {/* Media library picker button */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={disabled}
          title="Pick from media library"
          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-brand-400 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-brand-500/50 dark:hover:bg-brand-500/10"
        >
          {value && isImageType ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon size={16} className="text-gray-400 dark:text-gray-500" />
          )}
        </button>

        {/* Manual URL input */}
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
        />
      </div>

      {/* Full preview below */}
      {value && isImageType && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="preview" className={previewClassName} />
      )}
      {value && !isImageType && (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
        >
          <FileText size={13} /> View uploaded file
        </a>
      )}

      {hint && <p className="text-xs leading-relaxed text-gray-400 dark:text-gray-500">{hint}</p>}

      {open && (
        <MediaLibraryModal
          filterType={filterType}
          onSelect={(file) => { onChange(file.url); setOpen(false); }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
