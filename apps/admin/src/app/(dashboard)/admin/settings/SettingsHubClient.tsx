"use client";

import Link from "next/link";
import { Sliders, CaretRight } from "@phosphor-icons/react";
import { hasPermission } from "@/features/auth/permissions";
import { menuGroups } from "@/shared/layout/admin-menu";
import { getTint } from "@/shared/layout/sidebar-colors";

const SECTION_DESCRIPTIONS: Record<string, string> = {
  "/admin/settings/general":
    "Site identity, branding, contact details and core configuration that define how your platform operates.",
  "/admin/settings/menus": "Build and organize the navigation menus shown across the student-facing website.",
  "/admin/settings/payment": "Configure payment gateways and checkout options used at course purchase.",
  "/admin/settings/social-links": "Manage the social media links shown in the footer and contact page.",
  "/admin/settings/tracking": "Set up analytics and tracking scripts such as Google Analytics or Meta Pixel.",
  "/admin/settings/code-snippets": "Inject custom HTML, CSS or JavaScript snippets into your website.",
  "/admin/settings/maintenance": "Take the student site offline for scheduled maintenance without affecting the admin panel.",
  "/admin/settings/configaction": "File, video & SMS provider credentials (Cloudflare R2, Bunny Stream, Bulk SMS).",
};

interface Props {
  isSuperAdmin: boolean;
  permissions: string[];
}

export function SettingsHubClient({ isSuperAdmin, permissions }: Props) {
  const group = menuGroups.find((g) => g.label === "System Settings");
  const items = (group?.items ?? []).filter(
    (item) => isSuperAdmin || !item.perm || hasPermission(permissions, item.perm),
  );

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-brand-50/60 via-white to-white p-6 dark:border-slate-800 dark:from-slate-900/60 dark:via-slate-900 dark:to-slate-900 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm sm:h-11 sm:w-11">
            <Sliders size={20} weight="fill" className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
              System Settings
            </h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">
              Manage core platform configuration, content settings and integrations.
            </p>
          </div>
        </div>
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          const tint = getTint(item.color);
          const description = SECTION_DESCRIPTIONS[item.href] ?? "";
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-brand-300 hover:shadow-lg hover:shadow-gray-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500/40 dark:hover:shadow-black/30"
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-black/5 dark:ring-white/10 ${tint.tint}`}>
                  <Icon size={20} weight="fill" className={tint.icon} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">{item.label}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 transition-transform group-hover:translate-x-0.5 dark:text-brand-400">
                  Manage
                  <CaretRight size={11} weight="bold" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          Your role doesn&apos;t have access to any system settings.
        </div>
      )}
    </div>
  );
}
