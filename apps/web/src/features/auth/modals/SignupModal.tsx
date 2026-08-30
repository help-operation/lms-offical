"use client";

import { useAuthModal } from "../AuthModalContext";
import { AuthShell } from "../AuthShell";

export function SignupModal() {
  const { closeModal } = useAuthModal();
  return <AuthShell mode="modal" initialTab="signup" onClose={closeModal} />;
}
