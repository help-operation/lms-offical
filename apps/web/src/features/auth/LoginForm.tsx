"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IdentifierLoginSchema, type IdentifierLoginInput } from "@repo/validators";
import { apiRequestBrowser, ApiError } from "@/lib/api-client-browser";
import { Eye, EyeOff, Loader2, HelpCircle } from "lucide-react";
import Link from "next/link";
import { trackLogin } from "@/shared/utils/dataLayer";

export function LoginForm({
  defaultIdentifier,
  onSuccess,
  onForgotPassword,
  onCreateAccount,
}: {
  defaultIdentifier?: string;
  onSuccess?: () => void;
  onForgotPassword?: () => void;
  onCreateAccount?: (identifier: string) => void;
} = {}) {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [noAccountFor, setNoAccountFor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IdentifierLoginInput>({
    resolver: zodResolver(IdentifierLoginSchema),
    defaultValues: { identifier: defaultIdentifier ?? "", password: "" },
  });

  useEffect(() => {
    if (defaultIdentifier) reset({ identifier: defaultIdentifier, password: "" });
  }, [defaultIdentifier, reset]);

  async function onSubmit(data: IdentifierLoginInput) {
    setServerError(null);
    setNoAccountFor(null);
    try {
      await apiRequestBrowser<null>("/auth/account/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
      trackLogin();
      onSuccess?.();
      router.refresh();
      router.push("/student/dashboard");
    } catch (err: any) {
      if (err instanceof ApiError && err.code === "ACCOUNT_NOT_FOUND") {
        setNoAccountFor(data.identifier);
        return;
      }
      setServerError(err?.message ?? "Something went wrong");
    }
  }

  if (noAccountFor) {
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-7 text-center dark:border-brand-500/30 dark:bg-brand-500/10">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-gray-800">
          <HelpCircle className="h-6 w-6 text-brand-500 dark:text-brand-400" />
        </div>
        <p className="font-semibold text-gray-900 dark:text-white">{noAccountFor}</p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          There&apos;s no account for this number/email, want to create one?
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setNoAccountFor(null)}
            className="rounded-lg bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            No, thanks
          </button>
          <button
            type="button"
            onClick={() => onCreateAccount?.(noAccountFor)}
            className="rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            New Account &gt;
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Email or phone */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">Enter your phone number or email</label>
        <div className="relative">
          <input
            type="text"
            placeholder="Enter your phone number or email"
            {...register("identifier")}
            className="w-full rounded-xl border border-gray-100 bg-gray-50/70 py-3.5 px-4 text-sm transition-all focus:border-brand-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-white dark:focus:bg-gray-900"
          />
        </div>
        {errors.identifier && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.identifier.message}</p>}
      </div>

      {/* Password */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">Enter your password</label>
        <div className="relative">
          <input
            type={showPass ? "text" : "password"}
            placeholder="Enter your password"
            {...register("password")}
            className="w-full rounded-xl border border-gray-100 bg-gray-50/70 py-3.5 pl-4 pr-10 text-sm transition-all focus:border-brand-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900/60 dark:text-white dark:focus:bg-gray-900"
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.password.message}</p>}
      </div>

      {serverError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">{serverError}</div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-from to-brand-to py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
          </>
        ) : (
          "Log in"
        )}
      </button>

      <p className="flex flex-wrap items-center justify-center gap-x-2 text-center text-sm text-gray-500 dark:text-gray-400">
        <span>
          Don&apos;t have an account?{" "}
          {onCreateAccount ? (
            <button
              type="button"
              onClick={() => onCreateAccount(getValues("identifier") || "")}
              className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              Sign up
            </button>
          ) : (
            <Link href="/signup" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
              Sign up
            </Link>
          )}
        </span>
        <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        {onForgotPassword ? (
          <button
            type="button"
            onClick={onForgotPassword}
            className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            Forgot password?
          </button>
        ) : (
          <Link href="/forgot-password" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
            Forgot password?
          </Link>
        )}
      </p>
    </form>
  );
}
