"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "success";
  icon?: ReactNode;
  isPending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const variantStyles = {
  danger:  { icon: "bg-red-100 dark:bg-red-500/15",    button: "bg-red-600 hover:bg-red-700"    },
  warning: { icon: "bg-yellow-100 dark:bg-yellow-500/15", button: "bg-yellow-500 hover:bg-yellow-600" },
  success: { icon: "bg-green-100 dark:bg-green-500/15",  button: "bg-green-600 hover:bg-green-700" },
};

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  icon,
  isPending,
  onConfirm,
  onClose,
}: Props) {
  if (!open) return null;

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${styles.icon}`}>
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{message}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 ml-2 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60 ${styles.button}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
