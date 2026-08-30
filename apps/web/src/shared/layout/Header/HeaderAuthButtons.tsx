"use client";

import { useAuthModal } from "@/features/auth/AuthModalContext";
import { Button } from "@repo/ui/button";

export function HeaderAuthButtons() {
  const { openLogin, openSignup } = useAuthModal();

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={openLogin}>
        Sign in
      </Button>
      <Button
        size="sm"
        onClick={openSignup}
        className="bg-gradient-to-r from-brand-600 to-pink-500 hover:opacity-90 text-white border-0"
      >
        Get Started
      </Button>
    </div>
  );
}
