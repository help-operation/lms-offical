"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, GraduationCap } from "lucide-react";
import { AuthTabs, type AuthTab } from "./AuthTabs";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";
import { ExitConfirmDialog } from "./ExitConfirmDialog";
import { useExitConfirm } from "./useExitConfirm";

const GOOGLE_AUTH_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/auth/google`;

export function AuthShell({
  mode,
  initialTab,
  image,
  title,
  onClose,
}: {
  mode: "modal" | "page";
  initialTab: AuthTab;
  image?: string;
  title?: string;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<AuthTab>(initialTab);
  const [defaultIdentifier, setDefaultIdentifier] = useState<string | undefined>(undefined);

  const { showDialog, requestLeave, confirm, cancel } = useExitConfirm({
    mode,
    onLeave: () => {
      if (mode === "modal") onClose?.();
      else router.push("/");
    },
  });

  // Modal chrome: Escape-to-close + body-scroll lock.
  useEffect(() => {
    if (mode !== "modal") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestLeave();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [mode, requestLeave]);

  function handleCreateAccount(identifier: string) {
    setDefaultIdentifier(identifier);
    setTab("signup");
  }

  function handleRegistered(identifier: string) {
    setDefaultIdentifier(identifier);
    setTab("login");
  }

  const content = (
    <>
      <AuthTabs active={tab} onChange={setTab} />
      {tab === "login" ? (
        <LoginForm
          key="login"
          defaultIdentifier={defaultIdentifier}
          onSuccess={mode === "modal" ? onClose : undefined}
          onCreateAccount={handleCreateAccount}
        />
      ) : (
        <SignupForm key="signup" defaultIdentifier={defaultIdentifier} onRegistered={handleRegistered} />
      )}

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        <span className="text-xs text-gray-400 dark:text-gray-500">Or</span>
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
      </div>

      <a
        href={GOOGLE_AUTH_URL}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <span className="text-base font-bold text-brand-600 dark:text-brand-400">G</span>
        Continue with Google
      </a>
    </>
  );

  if (mode === "modal") {
    return (
      <>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={requestLeave} />
          <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl shadow-brand-200/50 animate-in fade-in zoom-in-95 duration-200 dark:bg-gray-800 dark:shadow-black/40 sm:p-10">
            <button
              onClick={requestLeave}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mb-7 text-center">
              <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-pink-500 shadow-lg shadow-brand-200 dark:shadow-brand-900/40">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Skillkoro</h2>
            </div>
            {content}
          </div>
        </div>
        {showDialog && <ExitConfirmDialog onConfirm={confirm} onCancel={cancel} />}
      </>
    );
  }

  return (
    <main className="flex min-h-screen items-center bg-white py-12 dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-brand-50/60 p-3 dark:bg-gray-800/40">
          <div className="grid overflow-hidden rounded-3xl bg-white shadow-xl shadow-brand-100 dark:bg-gray-800 dark:shadow-black/40 lg:grid-cols-2">
            <div className="relative hidden min-h-[560px] lg:block">
              {image && <img src={image} alt="Learner" className="absolute inset-0 h-full w-full object-cover" />}
            </div>
            <div className="p-10 sm:p-14">
              {title && <h1 className="text-center text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">{title}</h1>}
              <div className="mt-8">{content}</div>
            </div>
          </div>
        </div>
      </div>
      {showDialog && <ExitConfirmDialog onConfirm={confirm} onCancel={cancel} />}
    </main>
  );
}
