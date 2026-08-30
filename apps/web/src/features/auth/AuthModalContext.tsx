"use client";

import { createContext, useContext, useState } from "react";

type ModalType = "login" | "signup" | "forgot" | null;

interface AuthModalContextValue {
  modal: ModalType;
  openLogin: () => void;
  openSignup: () => void;
  openForgotPassword: () => void;
  closeModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<ModalType>(null);

  return (
    <AuthModalContext.Provider
      value={{
        modal,
        openLogin: () => setModal("login"),
        openSignup: () => setModal("signup"),
        openForgotPassword: () => setModal("forgot"),
        closeModal: () => setModal(null),
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}
