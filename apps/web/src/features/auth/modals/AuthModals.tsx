"use client";

import { useAuthModal } from "../AuthModalContext";
import { LoginModal } from "./LoginModal";
import { SignupModal } from "./SignupModal";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

export function AuthModals() {
  const { modal } = useAuthModal();

  if (modal === "login") return <LoginModal />;
  if (modal === "signup") return <SignupModal />;
  if (modal === "forgot") return <ForgotPasswordModal />;
  return null;
}
