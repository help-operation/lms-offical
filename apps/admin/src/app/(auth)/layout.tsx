import { type CSSProperties, type ReactNode } from "react";
import { generalSettingsApi } from "@/features/general-settings/api";
import { generateBrandScale, isHexColor, brandScaleToCssVars } from "@/shared/utils/color";

export default async function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const settingsRes = await generalSettingsApi
    .getPublic(["general_admin_accent_color"])
    .catch(() => null);
  const settings = settingsRes?.data ?? {};

  const accentColor = settings.general_admin_accent_color;
  const brandStyle: CSSProperties | undefined =
    accentColor && isHexColor(accentColor)
      ? (brandScaleToCssVars(generateBrandScale(accentColor)) as CSSProperties)
      : undefined;

  return (
    <div style={brandStyle} suppressHydrationWarning>
      {children}
    </div>
  );
}
