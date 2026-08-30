"use client";

import { Film, Music, FileText, File, Image as ImageIcon } from "lucide-react";
import { MediaPreview } from "./MediaPreview";
import type { MediaFile } from "@/features/media/types";
import { useLocalization } from "@/shared/context/LocalizationContext";

interface MediaListViewProps {
  files: MediaFile[];
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
  onOpen: (file: MediaFile) => void;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  image:    ImageIcon,
  video:    Film,
  audio:    Music,
  document: FileText,
  other:    File,
};

const TYPE_LABEL: Record<string, string> = {
  image:    "Image",
  video:    "Video",
  audio:    "Audio",
  document: "Document",
  other:    "File",
};

export function MediaListView({ files, selectedIds, onToggle, onOpen }: MediaListViewProps) {
  const { formatDate } = useLocalization();
  if (files.length === 0) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">No files found.</div>
    );
  }

  const allChecked = files.length > 0 && files.every((f) => selectedIds.has(f.id));

  function handleSelectAll(checked: boolean) {
    files.forEach((f) => {
      const has = selectedIds.has(f.id);
      if (checked && !has) onToggle(f.id);
      if (!checked && has) onToggle(f.id);
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <th className="py-3 pl-4 pr-2 w-10">
              <input
                type="checkbox"
                className="rounded border-gray-300 cursor-pointer"
                checked={allChecked}
                onChange={(e) => handleSelectAll(e.target.checked)}
                aria-label="Select all"
              />
            </th>
            <th className="py-3 px-3">File</th>
            <th className="py-3 px-3 hidden sm:table-cell">Type</th>
            <th className="py-3 px-3 hidden md:table-cell">Size</th>
            <th className="py-3 px-3 hidden lg:table-cell">Uploaded</th>
            <th className="py-3 px-3 w-16" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {files.map((file) => {
            const TypeIcon = TYPE_ICON[file.type] ?? File;
            const selected = selectedIds.has(file.id);
            return (
              <tr
                key={file.id}
                className={`transition-colors hover:bg-gray-50 ${selected ? "bg-indigo-50/40" : ""}`}
              >
                <td className="py-3 pl-4 pr-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 cursor-pointer"
                    checked={selected}
                    onChange={() => onToggle(file.id)}
                  />
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-100">
                      <MediaPreview file={file} className="h-full w-full" />
                    </div>
                    <div className="min-w-0">
                      <p className="max-w-[180px] truncate font-medium text-gray-800">
                        {file.filename}
                      </p>
                      <p className="max-w-[180px] truncate text-xs text-gray-400">
                        {file.originalName}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 hidden sm:table-cell">
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                    <TypeIcon className="h-3.5 w-3.5" />
                    {TYPE_LABEL[file.type] ?? "File"}
                  </span>
                </td>
                <td className="py-3 px-3 hidden md:table-cell text-gray-500 text-xs">
                  {file.formattedSize}
                </td>
                <td className="py-3 px-3 hidden lg:table-cell text-gray-400 text-xs">
                  {formatDate(file.createdAt)}
                </td>
                <td className="py-3 px-3">
                  <button
                    onClick={() => onOpen(file)}
                    className="text-xs font-medium text-indigo-600 hover:underline"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
