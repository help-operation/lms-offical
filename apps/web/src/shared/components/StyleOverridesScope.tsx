"use client";

import { TemplateStyleScope } from "@repo/ui/template-style-overrides";
import type { ReactNode } from "react";

interface StyleOverridesScopeProps {
  overrides?: Record<string, any>;
  children: ReactNode;
}

/**
 * Client wrapper around TemplateStyleScope for use in server components.
 * Applies per-element style overrides (font, color, size, text) to the wrapped content.
 */
export function StyleOverridesScope({ overrides, children }: StyleOverridesScopeProps) {
  return (
    <TemplateStyleScope overrides={overrides as any}>
      {children}
    </TemplateStyleScope>
  );
}
