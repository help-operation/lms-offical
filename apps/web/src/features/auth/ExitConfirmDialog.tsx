"use client";

import { Info } from "lucide-react";

export function ExitConfirmDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border-2 border-brand-400 bg-white p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-150 dark:border-brand-500/50 dark:bg-gray-800">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
          <Info className="h-6 w-6 text-red-500 dark:text-red-400" />
        </div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
          Are you sure you want to leave the login / register page?
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Yes, leave
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Stay here
          </button>
        </div>
      </div>
    </div>
  );
}
