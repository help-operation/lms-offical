// Maps each menu item's solid color (e.g. "bg-brand-500") to the tint background
// and icon text color used when the item is INACTIVE. Full literal class names are
// required here so Tailwind generates the CSS (it can't see dynamically built strings).

type Tint = { tint: string; icon: string };

const COLOR_TINTS: Record<string, Tint> = {
  "bg-violet-500": { tint: "bg-violet-50 dark:bg-violet-500/15", icon: "text-violet-500 dark:text-violet-400" },
  "bg-violet-700": { tint: "bg-violet-50 dark:bg-violet-500/15", icon: "text-violet-700 dark:text-violet-400" },
  "bg-blue-500": { tint: "bg-blue-50 dark:bg-blue-500/15", icon: "text-blue-500 dark:text-blue-400" },
  "bg-sky-500": { tint: "bg-sky-50 dark:bg-sky-500/15", icon: "text-sky-500 dark:text-sky-400" },
  "bg-sky-600": { tint: "bg-sky-50 dark:bg-sky-500/15", icon: "text-sky-600 dark:text-sky-400" },
  "bg-indigo-500": { tint: "bg-indigo-50 dark:bg-indigo-500/15", icon: "text-indigo-500 dark:text-indigo-400" },
  "bg-cyan-500": { tint: "bg-cyan-50 dark:bg-cyan-500/15", icon: "text-cyan-500 dark:text-cyan-400" },
  "bg-cyan-600": { tint: "bg-cyan-50 dark:bg-cyan-500/15", icon: "text-cyan-600 dark:text-cyan-400" },
  "bg-fuchsia-500": { tint: "bg-fuchsia-50 dark:bg-fuchsia-500/15", icon: "text-fuchsia-500 dark:text-fuchsia-400" },
  "bg-teal-500": { tint: "bg-teal-50 dark:bg-teal-500/15", icon: "text-teal-500 dark:text-teal-400" },
  "bg-teal-600": { tint: "bg-teal-50 dark:bg-teal-500/15", icon: "text-teal-600 dark:text-teal-400" },
  "bg-pink-500": { tint: "bg-pink-50 dark:bg-pink-500/15", icon: "text-pink-500 dark:text-pink-400" },
  "bg-orange-500": { tint: "bg-orange-50 dark:bg-orange-500/15", icon: "text-orange-500 dark:text-orange-400" },
  "bg-green-500": { tint: "bg-green-50 dark:bg-green-500/15", icon: "text-green-500 dark:text-green-400" },
  "bg-emerald-500": { tint: "bg-emerald-50 dark:bg-emerald-500/15", icon: "text-emerald-500 dark:text-emerald-400" },
  "bg-lime-600": { tint: "bg-lime-50 dark:bg-lime-500/15", icon: "text-lime-600 dark:text-lime-400" },
  "bg-rose-500": { tint: "bg-rose-50 dark:bg-rose-500/15", icon: "text-rose-500 dark:text-rose-400" },
  "bg-rose-400": { tint: "bg-rose-50 dark:bg-rose-500/15", icon: "text-rose-400 dark:text-rose-300" },
  "bg-rose-300": { tint: "bg-rose-50 dark:bg-rose-500/15", icon: "text-rose-300 dark:text-rose-300" },
  "bg-rose-600": { tint: "bg-rose-50 dark:bg-rose-500/15", icon: "text-rose-600 dark:text-rose-400" },
  "bg-amber-500": { tint: "bg-amber-50 dark:bg-amber-500/15", icon: "text-amber-500 dark:text-amber-400" },
  "bg-yellow-500": { tint: "bg-yellow-50 dark:bg-yellow-500/15", icon: "text-yellow-500 dark:text-yellow-400" },
  "bg-red-500": { tint: "bg-red-50 dark:bg-red-500/15", icon: "text-red-500 dark:text-red-400" },
  "bg-purple-500": { tint: "bg-purple-50 dark:bg-purple-500/15", icon: "text-purple-500 dark:text-purple-400" },
  "bg-slate-500": { tint: "bg-slate-50 dark:bg-slate-500/15", icon: "text-slate-500 dark:text-slate-400" },
  "bg-gray-600": { tint: "bg-gray-50 dark:bg-slate-500/15", icon: "text-gray-600 dark:text-slate-400" },
  "bg-gray-500": { tint: "bg-gray-50 dark:bg-slate-500/15", icon: "text-gray-500 dark:text-slate-400" },
  "bg-slate-600": { tint: "bg-slate-50 dark:bg-slate-500/15", icon: "text-slate-600 dark:text-slate-400" },
  "bg-emerald-600": { tint: "bg-emerald-50 dark:bg-emerald-500/15", icon: "text-emerald-600 dark:text-emerald-400" },
  "bg-indigo-600": { tint: "bg-indigo-50 dark:bg-indigo-500/15", icon: "text-indigo-600 dark:text-indigo-400" },
};

const FALLBACK: Tint = { tint: "bg-gray-100 dark:bg-slate-500/15", icon: "text-gray-500 dark:text-slate-400" };

export function getTint(color: string): Tint {
  return COLOR_TINTS[color] ?? FALLBACK;
}
