"use client";

import { useState, useTransition } from "react";
import {
  Wrench, ShieldCheck, MessageSquare, Eye, Monitor, Smartphone,
  Crown, Lock, Globe, Zap, SlidersHorizontal, Save,
} from "lucide-react";
import { toast } from "@repo/ui/sonner";
import { Switch } from "@repo/ui/switch";
import {
  setMaintenanceEnabledAction,
  setMaintenanceMessageAction,
} from "./actions";

interface Props {
  initialEnabled: boolean;
  initialMessage: string;
}

const FEATURES = [
  {
    icon: Lock,
    title: "Secure & Safe",
    desc: "Only admins can access the dashboard during maintenance.",
  },
  {
    icon: Globe,
    title: "User Friendly",
    desc: "Visitors see a beautiful, professional maintenance page.",
  },
  {
    icon: Zap,
    title: "No Downtime Impact",
    desc: "Your updates happen in the background without affecting data.",
  },
  {
    icon: SlidersHorizontal,
    title: "Fully Customizable",
    desc: "Personalize your message and branding to fit your needs.",
  },
];

function IconBadge({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 transition-colors dark:bg-brand-900 sm:h-11 sm:w-11">
      <Icon className="h-4 w-4 text-brand-600 dark:text-brand-300 sm:h-5 sm:w-5" />
    </div>
  );
}

const CARD_CLASS =
  "rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-6 dark:border-slate-700 dark:bg-slate-900 dark:hover:shadow-black/20";

export function MaintenanceSettingsClient({ initialEnabled, initialMessage }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [message, setMessage] = useState(initialMessage);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !enabled;
    startTransition(async () => {
      const res = await setMaintenanceEnabledAction(next);
      if (res.success) {
        setEnabled(next);
        toast.success(next ? "Maintenance mode enabled" : "Maintenance mode disabled");
      } else {
        toast.error(res.message ?? "Failed to update");
      }
    });
  }

  function handleSaveMessage() {
    startTransition(async () => {
      const res = await setMaintenanceMessageAction(message.trim());
      if (res.success) {
        toast.success("Message saved");
      } else {
        toast.error(res.message ?? "Failed to save message");
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
      <div className="space-y-4 sm:space-y-6 lg:col-span-2">
        {/* Toggle + Site Status */}
        <div className={CARD_CLASS}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <IconBadge icon={ShieldCheck} />
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Enable Maintenance Mode</h2>
                <p className="mt-0.5 max-w-md text-xs text-gray-500 dark:text-gray-400">
                  When ON, the student website shows a maintenance page to all visitors.
                  The admin dashboard stays fully accessible.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap sm:gap-4">
              <label className="flex cursor-pointer items-center" aria-label={enabled ? "Disable maintenance mode" : "Enable maintenance mode"}>
                <Switch
                  checked={enabled}
                  onCheckedChange={handleToggle}
                  disabled={isPending}
                  className="data-[state=checked]:bg-brand-600 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-slate-700 focus-visible:ring-brand-500 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                />
              </label>

              <div className="hidden h-10 w-px bg-gray-200 dark:bg-slate-700 sm:block" />

              <div className="flex flex-1 items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-slate-800 sm:flex-none sm:px-4 sm:py-2.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${enabled ? "bg-amber-500 animate-pulse" : "bg-green-500"}`} />
                <div className="text-xs">
                  <p className="font-semibold text-gray-700 dark:text-white">Site Status</p>
                  <p className={enabled ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}>
                    {enabled ? "Under maintenance" : "Site is live"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message editor */}
        <div className={CARD_CLASS}>
          <div className="mb-4 flex items-start gap-3 sm:gap-4">
            <IconBadge icon={MessageSquare} />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Maintenance Message</h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                This message is shown to visitors on the maintenance page.
              </p>
            </div>
          </div>

          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. We are performing scheduled maintenance and will be back shortly."
            className="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
          />

          <div className="mt-3 flex justify-end">
            <button
              onClick={handleSaveMessage}
              disabled={isPending || !message.trim()}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 sm:w-auto"
            >
              <Save className="h-4 w-4" />
              {isPending ? "Saving…" : "Save Message"}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className={CARD_CLASS}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <IconBadge icon={Eye} />
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Preview</h2>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  This is how your maintenance page will look to visitors.
                </p>
              </div>
            </div>

            <div className="flex w-full gap-1 rounded-lg border border-gray-100 bg-gray-50 p-1 dark:border-slate-700 dark:bg-slate-900 sm:w-auto">
              <button
                onClick={() => setPreviewMode("desktop")}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-150 sm:flex-none ${
                  previewMode === "desktop"
                    ? "bg-white text-brand-700 shadow-sm dark:bg-slate-700 dark:text-brand-300"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <Monitor className="h-3.5 w-3.5" /> Desktop
              </button>
              <button
                onClick={() => setPreviewMode("mobile")}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-150 sm:flex-none ${
                  previewMode === "mobile"
                    ? "bg-white text-brand-700 shadow-sm dark:bg-slate-700 dark:text-brand-300"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" /> Mobile
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-lg border border-gray-100 bg-gradient-to-br from-brand-50/60 via-white to-white p-6 dark:border-slate-700 dark:from-slate-900/60 dark:via-slate-800 dark:to-slate-900 sm:p-10">
            {/* Decorative dot grid */}
            <div
              className="pointer-events-none absolute left-0 top-0 h-32 w-32 opacity-60"
              style={{
                backgroundImage: "radial-gradient(circle, #c4b5fd 1.5px, transparent 1.5px)",
                backgroundSize: "16px 16px",
                maskImage: "radial-gradient(circle at top left, black, transparent 70%)",
              }}
            />
            {/* Decorative blob */}
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-brand-100/70 blur-2xl dark:bg-brand-800/30" />

            <div className={`relative mx-auto text-center transition-all ${previewMode === "mobile" ? "max-w-xs" : "max-w-lg"}`}>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900">
                <Wrench className="h-7 w-7 text-brand-600 dark:text-brand-300" />
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">Under Maintenance</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {message.trim() || "Your maintenance message will appear here."}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500 dark:bg-brand-400" />
                We&rsquo;ll be back soon
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`h-fit ${CARD_CLASS}`}>
        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900">
          <Crown className="h-5 w-5 text-brand-600 dark:text-brand-300" />
        </div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Keep things running smoothly</h3>
        <p className="mt-2 border-b border-gray-100 py-2 text-sm text-gray-500 dark:border-slate-700 dark:text-gray-400">
          Maintenance mode helps you update and improve your site without interruptions.
        </p>

        <div className="mt-5 divide-y divide-gray-100 dark:divide-slate-700">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 transition-colors dark:bg-slate-700">
                <Icon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
