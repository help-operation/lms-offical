"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X, Plus } from "lucide-react";
import { NewCourseForm } from "./NewCourseForm";
import type { Category } from "@/features/courses/api";

interface NewCourseModalProps {
  categories: Category[];
  /** When false, this instance ignores the ?new=1 auto-open param (avoids
   *  double modals when the page renders more than one trigger). */
  autoOpen?: boolean;
}

export function NewCourseModal({ categories, autoOpen = true }: NewCourseModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const wantsNew = autoOpen && searchParams.get("new") === "1";
  const [open, setOpen] = useState(wantsNew);

  // Open when navigated to with ?new=1 (e.g. sidebar "Create Course" link)
  useEffect(() => {
    if (wantsNew) setOpen(true);
  }, [wantsNew]);

  const close = useCallback(() => {
    setOpen(false);
    if (wantsNew) router.replace(pathname);
  }, [wantsNew, router, pathname]);

  // Close on ESC key
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function handleSuccess() {
    close();
    router.refresh();
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
      >
        <Plus className="h-4 w-4" />
        New Course
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={close}
          />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Create New Course</h2>
                <p className="text-xs text-gray-400 mt-0.5">Fill in the basics — you can edit everything later</p>
              </div>
              <button
                onClick={close}
                className="flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-6">
              <NewCourseForm categories={categories} onSuccess={handleSuccess} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
