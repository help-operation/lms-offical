"use client";

import { useEffect } from "react";
import { GraduationCap, X } from "lucide-react";
import { useAuthModal } from "../AuthModalContext";
import { ForgotPasswordForm } from "../ForgotPasswordForm";

export function ForgotPasswordModal() {
  const { closeModal, openLogin } = useAuthModal();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closeModal]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeModal}
      />

      {/* Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:shadow-black/40">
        {/* Close */}
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-600 to-pink-500 mb-3 shadow-lg shadow-brand-200 dark:shadow-brand-900/40">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Skillkoro</h2>
          <p className="text-sm text-gray-500 mt-0.5 dark:text-gray-400">Reset your password</p>
        </div>

        {/* Form */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1 dark:text-white">Forgot password?</h3>
          <p className="text-sm text-gray-500 mb-5 dark:text-gray-400">
            Enter your phone number and we&apos;ll send you an OTP to reset your password.
          </p>
          <ForgotPasswordForm onSuccess={closeModal} />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6 dark:text-gray-400">
          Remember your password?{" "}
          <button
            onClick={openLogin}
            className="text-brand-600 hover:text-brand-700 font-semibold transition-colors dark:text-brand-400 dark:hover:text-brand-300"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
