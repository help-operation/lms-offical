import { CloudArrowUp, VideoCamera, ChatText } from "@phosphor-icons/react";

export interface ProviderMeta {
  icon: typeof CloudArrowUp;
  description: string;
  color: { bg: string; text: string; darkBg: string; darkText: string };
}

export const PROVIDER_META: Record<string, ProviderMeta> = {
  r2: {
    icon: CloudArrowUp,
    description: "Used for every image and file uploaded across the platform",
    color: { bg: "bg-cyan-100", text: "text-cyan-600", darkBg: "dark:bg-cyan-500/10", darkText: "dark:text-cyan-300" },
  },
  bunny: {
    icon: VideoCamera,
    description: "Video hosting, encoding & secure playback for recorded and live lessons",
    color: { bg: "bg-rose-100", text: "text-rose-600", darkBg: "dark:bg-rose-500/10", darkText: "dark:text-rose-300" },
  },
  bulksms: {
    icon: ChatText,
    description: "Used for OTPs, event notifications, and bulk SMS broadcasts",
    color: { bg: "bg-amber-100", text: "text-amber-600", darkBg: "dark:bg-amber-500/10", darkText: "dark:text-amber-300" },
  },
};

export const DEFAULT_PROVIDER_META: ProviderMeta = {
  icon: CloudArrowUp,
  description: "Storage provider credentials",
  color: { bg: "bg-gray-100", text: "text-gray-600", darkBg: "dark:bg-slate-800", darkText: "dark:text-gray-300" },
};

export function getProviderMeta(id: string): ProviderMeta {
  return PROVIDER_META[id] ?? DEFAULT_PROVIDER_META;
}
