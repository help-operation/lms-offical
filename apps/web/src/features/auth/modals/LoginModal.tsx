"use client";

import { useAuthModal } from "../AuthModalContext";
import { AuthShell } from "../AuthShell";

export function LoginModal() {
  const { closeModal } = useAuthModal();
  return <AuthShell mode="modal" initialTab="login" onClose={closeModal} />;
}
