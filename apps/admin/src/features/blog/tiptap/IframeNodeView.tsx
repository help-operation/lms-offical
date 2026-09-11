"use client";

import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { Trash2, ExternalLink } from "lucide-react";
import { useState } from "react";

interface IframeAttrs {
  src: string;
  width?: string;
  height?: string;
}

function getPlatformLabel(src: string): string {
  if (src.includes("youtube.com") || src.includes("youtu.be")) return "YouTube";
  if (src.includes("vimeo.com")) return "Vimeo";
  if (src.includes("facebook.com") || src.includes("fb.com")) return "Facebook";
  return "Embed";
}

export function IframeNodeView({
  node,
  updateAttributes,
  deleteNode,
}: {
  node: { attrs: IframeAttrs };
  updateAttributes: (attrs: Partial<IframeAttrs>) => void;
  deleteNode: () => void;
}) {
  const { src } = node.attrs;
  const [editing, setEditing] = useState(!src);

  if (!src) {
    return (
      <NodeViewWrapper class="blog-embed-placeholder">
        <div className="my-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-400">Empty embed — select content to display</p>
          <button
            type="button"
            onClick={deleteNode}
            className="mt-2 text-xs text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper class="blog-embed-wrapper">
      <div className="group relative my-4">
        {/* Platform badge */}
        <div className="absolute left-2 top-2 z-10 rounded-md bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
          {getPlatformLabel(src)}
        </div>

        {/* Action buttons */}
        <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-black/70 text-white hover:bg-black/90 transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            onClick={deleteNode}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-red-600/80 text-white hover:bg-red-600 transition-colors"
            title="Remove embed"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Iframe */}
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <iframe
            src={src}
            width={node.attrs.width ?? "100%"}
            height={node.attrs.height ?? "400"}
            frameBorder="0"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            className="h-auto w-full"
            title="Embedded content"
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
}
