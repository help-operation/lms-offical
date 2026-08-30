"use client";

import { useState, useTransition } from "react";
import { updatePageAction } from "@/features/pages/actions/pages.actions";
import { toast } from "@repo/ui/sonner";

type Props = {
  slug: string;
  title: string;
  initialContent: string;
};

export function PageEditor({ slug, title, initialContent }: Props) {
  const [content, setContent] = useState(initialContent);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      try {
        const res = await updatePageAction(slug, content);
        if (!res.success) throw new Error(res.message);
        toast.success("Page saved successfully");
      } catch {
        toast.error("Failed to save page");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            This content will be displayed on the public website.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
          <p className="text-xs font-medium text-gray-500">
            HTML content — changes are live immediately after saving
          </p>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={24}
          placeholder={`<h2>${title}</h2>\n<p>Write your content here...</p>`}
          className="w-full resize-none p-4 font-mono text-sm text-gray-800 focus:outline-none"
          spellCheck={false}
        />
      </div>

      {/* Live preview */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
          <p className="text-xs font-medium text-gray-500">Preview</p>
        </div>
        <div
          className="prose prose-sm max-w-none p-6 text-gray-700"
          dangerouslySetInnerHTML={{ __html: content || "<p class='text-gray-400'>Nothing to preview yet.</p>" }}
        />
      </div>
    </div>
  );
}
