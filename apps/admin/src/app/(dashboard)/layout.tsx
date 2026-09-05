import { redirect } from "next/navigation";
import Script from "next/script";
import { Suspense, type CSSProperties, type ReactNode } from "react";
import { authApi } from "@/features/auth/api";
import { generalSettingsApi } from "@/features/general-settings/api";
import { AdminSidebar } from "@/shared/layout/AdminSidebar";
import { MobileSidebar } from "@/shared/layout/MobileSidebar";
import { RouteGuard } from "@/shared/layout/RouteGuard";
import { AdminTopHeader } from "@/shared/layout/AdminTopHeader";
import { SidebarProvider } from "@/shared/layout/SidebarContext";
import { LocalizationProvider } from "@/shared/context/LocalizationContext";
import { generateBrandScale, isHexColor, brandScaleToCssVars } from "@/shared/utils/color";
import { getFontClassName, getFontCssVar } from "@/shared/utils/font-registry";

export default function DashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-gray-50 text-sm text-gray-400">
          Loading…
        </div>
      }
    >
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}

async function DashboardLayoutContent({
  children,
}: Readonly<{ children: ReactNode }>) {
  // Fired in parallel — these are independent reads (auth/me, admin
  // settings), and this layout re-executes on every dashboard navigation, so
  // running them sequentially doubled the latency of every single page load.
  const [user, settingsRes] = await Promise.all([
    authApi.me().catch(() => null),
    // Admin-only appearance + localization — fetched once per layout render so
    // every page under the dashboard shares the same accent color / date-time
    // display format without each feature re-fetching it. Never applied to the
    // student-facing web app, which has its own separate settings.
    generalSettingsApi.get().catch(() => null),
  ]);

  if (!user) redirect("/login");

  const role = user.data.role;
  if (role !== "INSTRUCTOR" && role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const permissions = user.data.permissions ?? [];
  const fullName = `${user.data.firstName} ${user.data.lastName}`;
  const initial = user.data.firstName?.[0]?.toUpperCase() ?? "U";

  const settings = settingsRes?.data ?? {};

  const accentColor = settings.general_admin_accent_color;
  const brandStyle: CSSProperties | undefined =
    accentColor && isHexColor(accentColor)
      ? (brandScaleToCssVars(generateBrandScale(accentColor)) as CSSProperties)
      : undefined;

  // Font settings — apply selected fonts via CSS custom properties
  const englishFont = settings.general_english_font || "Poppins";
  const banglaFont = settings.general_bangla_font || "Hind Siliguri";
  const englishFontClass = getFontClassName(englishFont);
  const banglaFontClass = getFontClassName(banglaFont);
  const fontFamilyFallback = "ui-sans-serif, system-ui, sans-serif";
  // Include both fonts in the font stack — next/font/google sets up @font-face
  // with unicode-range so the browser automatically picks the right font per script.
  // English font first (primary), Bengali font second (for Bengali characters).
  const fontStyle: CSSProperties = {
    "--font-sans": `'${englishFont}', '${banglaFont}', ${fontFamilyFallback}`,
    "--font-bengali": `'${banglaFont}', '${englishFont}', ${fontFamilyFallback}`,
    "--font-family-heading": `'${englishFont}', ${fontFamilyFallback}`,
    "--font-family-body": `'${englishFont}', '${banglaFont}', ${fontFamilyFallback}`,
  } as CSSProperties;

  return (
    <SidebarProvider>
      <LocalizationProvider
        timezone={settings.general_timezone || "Asia/Dhaka"}
        dateFormat={settings.general_date_format || "dd_mmm_yyyy"}
        timeFormat={settings.general_time_format || "12h"}
      >
        <div
          id="admin-dashboard-root"
          className={`flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-950 ${englishFontClass} ${banglaFontClass}`}
          style={{ ...brandStyle, ...fontStyle }}
          suppressHydrationWarning
        >
          {/* Theme flash prevention — applies the persisted class before first paint */}
          <Script
            id="theme-flash"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `try{if(localStorage.getItem('skillkoro-admin-theme')==='dark')document.getElementById('admin-dashboard-root').classList.add('dark');}catch(e){}`,
            }}
          />
          {role === "SUPER_ADMIN" ? (
            <AdminSidebar siteName={settings.general_site_name} />
          ) : (
            <AdminSidebar permissions={permissions} siteName={settings.general_site_name} />
          )}
          {role === "SUPER_ADMIN" ? (
            <MobileSidebar siteName={settings.general_site_name} />
          ) : (
            <MobileSidebar permissions={permissions} siteName={settings.general_site_name} />
          )}
          <div className="flex flex-1 flex-col overflow-hidden min-w-0">
            <AdminTopHeader userName={fullName} userInitial={initial} role={role} />
            <main className="flex-1 overflow-y-auto p-6">
              <RouteGuard
                permissions={permissions}
                isSuperAdmin={role === "SUPER_ADMIN"}
              >
                {children}
              </RouteGuard>
            </main>
          </div>
        </div>
      </LocalizationProvider>
    </SidebarProvider>
  );
}
