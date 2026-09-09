import { Button } from "@repo/ui/button";
import { MessageCircle, Phone, Search, Sparkles } from "lucide-react";
import { NotificationsBell } from "@/features/notifications/NotificationsBell";
import { PushInitializer } from "@/features/notifications/PushInitializer";
import { DashboardMobileNav } from "@/shared/layout/DashboardMobileNav";
import { DashboardPageHeading } from "@/shared/layout/DashboardPageHeading";
import { DashboardProfileMenu } from "@/shared/layout/DashboardProfileMenu";
import { DashboardSidebar } from "@/shared/layout/DashboardSidebar";
import { SidebarProvider } from "@/shared/layout/SidebarContext";
import { HeaderGreeting } from "@/shared/layout/HeaderGreeting";
import {
  guestNavItems,
  studentNavSections,
  settingsItems,
} from "@/shared/layout/dashboard-nav";
import { QuickAccessFooter } from "@/shared/layout/QuickAccessFooter";
import { ThemeToggle } from "@/features/theme/ThemeToggle";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { logoutAction } from "@/features/auth/actions/auth.actions";
import { authApi } from "@/features/auth/api";
import {
  getPublicContactSettings,
  getPublicSiteSettings,
  getPublicSocialLinks,
} from "@/features/cms/api/settings";
import { SiteLogo } from "@/shared/components/SiteLogo";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <Suspense fallback={<DashboardLayoutFallback />}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}

function DashboardLayoutFallback() {
  return (
    <div className="min-h-screen w-full bg-[#f7f8fa] text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen w-full">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block" />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 h-12 w-full max-w-sm rounded-full bg-white shadow-sm" />
          <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
            <div className="space-y-5">
              <div className="h-56 rounded-lg bg-white shadow-sm" />
              <div className="h-64 rounded-lg bg-white shadow-sm" />
            </div>
            <div className="h-96 rounded-lg bg-white shadow-sm" />
          </div>
        </main>
      </div>
    </div>
  );
}

async function DashboardLayoutContent({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await authApi.me().catch(() => null);

  if (!user) {
    redirect("/");
  }

  const initials =
    `${user.data.firstName.slice(0, 1)}${user.data.lastName.slice(0, 1)}`.toUpperCase();
  const isStudent = user.data.role === "STUDENT";
  const dashboardHref = isStudent ? "/student/dashboard" : "/guest/dashboard";
  const isGuest = !isStudent;

  const site = await getPublicSiteSettings();
  const logoSrc = site.logo_url || "/Skillkoro-logo.png";
  const logoDarkSrc = site.logo_url_dark || undefined;
  const logoAlt = site.site_name || "Skillkoro";

  const [contactSettings, socialLinks] = isGuest
    ? await Promise.all([getPublicContactSettings(), getPublicSocialLinks()])
    : [null, null];

  const contactPhone = contactSettings?.general_contact_phone?.trim() ?? "";
  const whatsappUrl = socialLinks?.whatsapp?.trim() ?? "";
  const showContactCard = isGuest && (contactPhone || whatsappUrl);

  // Pre-render icons for mobile drawer (with color info)
  const mainNavSections = studentNavSections.map((section) => ({
    title: section.title,
    items: section.items.map((item) => {
      const Icon = item.icon;
      return { label: item.label, href: item.href, icon: <Icon />, badge: item.badge, color: item.color };
    }),
  }));
  const guestNavDrawerItems = guestNavItems.map((item) => {
    const Icon = item.icon;
    return { label: item.label, href: item.href, icon: <Icon />, color: item.color };
  });
  const settingsDrawerItems = settingsItems.map((item) => {
    const Icon = item.icon;
    return { label: item.label, href: item.href, icon: <Icon />, color: item.color };
  });

  const contactCard = showContactCard ? (
    <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-brand-50 to-white p-4 dark:border-slate-800 dark:from-slate-800/60 dark:to-slate-900">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
          <Phone className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Need help?
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            We&apos;re here for you
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {contactPhone && (
          <a
            href={`tel:${contactPhone.replace(/\s+/g, "")}`}
            className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:text-brand dark:bg-slate-900 dark:text-slate-200"
          >
            <Phone className="h-4 w-4 text-brand" />
            {contactPhone}
          </a>
        )}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#1fb855]"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        )}
      </div>
    </div>
  ) : null;

  async function logout() {
    "use server";

    await logoutAction();
    redirect("/");
  }

  return (
    <div className="min-h-screen w-full bg-[#f7f8fa] text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <PushInitializer enabled={isStudent} />
      <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <DashboardSidebar
          logoSrc={logoSrc}
          logoDarkSrc={logoDarkSrc}
          logoAlt={logoAlt}
          isStudent={isStudent}
          dashboardHref={dashboardHref}
          contactCard={contactCard}
          user={{
            firstName: user.data.firstName,
            lastName: user.data.lastName,
            initials,
            avatar: user.data.avatar,
            email: user.data.email,
            phone: user.data.phone,
          }}
          onLogout={logout}
        />

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200/60 bg-[#f7f8fa]/80 px-4 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/80 sm:px-6 lg:px-8">
            {/* Left: Mobile nav + greeting + spacer */}
            <div className="flex flex-1 items-center gap-3">
              <DashboardMobileNav
                logoSrc={logoSrc}
                logoDarkSrc={logoDarkSrc}
                logoAlt={logoAlt}
                mainNavSections={isStudent ? mainNavSections : [{ title: "MAIN MENU", items: guestNavDrawerItems }]}
                settingsNav={settingsDrawerItems}
                footer={contactCard}
                dashboardHref={dashboardHref}
                user={{
                  firstName: user.data.firstName,
                  lastName: user.data.lastName,
                  initials,
                  avatar: user.data.avatar,
                  email: user.data.email,
                  phone: user.data.phone,
                }}
                isStudent={isStudent}
                onLogout={logout}
              />
              <HeaderGreeting />
            </div>

            {/* Center: Search bar */}
            <div className="hidden h-10 w-full max-w-sm items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-slate-400 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500 sm:flex">
              <Search className="h-4 w-4" />
              <input
                type="text"
                placeholder="Search courses, lessons..."
                className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
              />
            </div>

            {/* Right: Actions */}
            <div className="flex flex-1 items-center justify-end gap-2">
              <Link href="/" aria-label={logoAlt} className="lg:hidden">
                <SiteLogo
                  lightSrc={logoSrc}
                  darkSrc={logoDarkSrc}
                  alt={logoAlt}
                  width={140}
                  height={40}
                  className="h-8 w-auto object-contain"
                  priority
                />
              </Link>
              <ThemeToggle iconOnly />
              <NotificationsBell />
              <DashboardProfileMenu
                user={{
                  firstName: user.data.firstName,
                  lastName: user.data.lastName,
                  initials,
                  avatar: user.data.avatar,
                  role: user.data.role,
                }}
                dashboardHref={dashboardHref}
                isStudent={isStudent}
                onLogout={logout}
              />
            </div>
          </header>

          <main className="min-h-[calc(100vh-4rem)] px-4 pb-24 pt-6 sm:px-6 sm:pb-28 lg:px-8 lg:pb-8 lg:pt-8">
            <div>
              <DashboardPageHeading isStudent={isStudent} />
              <div className="mt-4">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Sticky quick-access footer — student only, mobile/tablet only */}
      {isStudent && <QuickAccessFooter />}

      </SidebarProvider>
    </div>
  );
}
