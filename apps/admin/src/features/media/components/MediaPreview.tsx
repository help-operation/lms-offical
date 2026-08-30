// Server Component — no 'use client' needed
import { Film, Music, FileText, File } from "lucide-react";
import type { MediaFile } from "@/features/media/types";

interface MediaPreviewProps {
  file: MediaFile;
  /** Extra classes applied to the outer container */
  className?: string;
}

export function MediaPreview({ file, className = "" }: MediaPreviewProps) {
  if (file.type === "image") {
    return (
      <div className={`relative bg-gray-50 overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={file.url}
          alt={file.altText || file.filename}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  if (file.type === "video") {
    return (
      <div className={`relative flex items-center justify-center bg-gray-900 overflow-hidden ${className}`}>
        {file.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.thumbnailUrl}
            alt={file.filename}
            className="h-full w-full object-cover opacity-70"
          />
        ) : (
          <Film className="h-8 w-8 text-gray-500" />
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-black/50 p-2.5">
            <Film className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    );
  }

  if (file.type === "audio") {
    return (
      <div className={`flex items-center justify-center bg-brand-50 ${className}`}>
        <Music className="h-8 w-8 text-brand-300" />
      </div>
    );
  }

  if (file.type === "document") {
    return (
      <div className={`flex items-center justify-center bg-blue-50 ${className}`}>
        <FileText className="h-8 w-8 text-blue-300" />
      </div>
    );
  }

  // other
  return (
    <div className={`flex items-center justify-center bg-gray-50 ${className}`}>
      <File className="h-8 w-8 text-gray-300" />
    </div>
  );
}
