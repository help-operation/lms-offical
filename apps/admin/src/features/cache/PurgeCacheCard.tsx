"use client";

import { useState, useTransition } from "react";
import { Broom, SpinnerGap, CheckCircle, Lightning } from "@phosphor-icons/react";
import { toast } from "@repo/ui/sonner";
import { purgeAllCacheAction } from "./actions";

/**
 * "Purge All" cache control (LiteSpeed-style). Drops every public cache tag on the
 * web app so the live site rebuilds from fresh data on the next visit. Edits already
 * purge their own tag automatically — this is the manual, site-wide override.
 */
export function PurgeCacheCard() {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handlePurge() {
    setDone(false);
    startTransition(async () => {
      const res = await purgeAllCacheAction();

      if (!res.success) {
        toast.error(res.message ?? "Failed to purge cache");
        return;
      }

      if (res.data.ok) {
        setDone(true);
        toast.success("All caches purged — the live site will refresh on next load.");
      } else if (res.data.reason === "disabled") {
        toast.warning(
          "Cache purging is disabled. Set WEB_URL and REVALIDATE_SECRET on the API.",
        );
      } else {
        toast.error("Couldn't reach the web app to purge. Check the API logs.");
      }
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-lg hover:shadow-gray-200/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-black/30 sm:p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 shadow-sm ring-1 ring-black/5 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-white/10">
          <Lightning size={18} weight="fill" />
        </div>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">Cache</span>
      </div>

      <p className="mb-4 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        The public site caches pages for speed and refreshes automatically whenever you
        edit content. Use this only if something looks stale after a change and you want
        to force a full refresh across the entire site.
      </p>

      <button
        onClick={handlePurge}
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-amber-600 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900 sm:w-auto"
      >
        {isPending ? (
          <SpinnerGap size={15} className="animate-spin" />
        ) : done ? (
          <CheckCircle size={15} weight="fill" />
        ) : (
          <Broom size={15} weight="bold" />
        )}
        {done && !isPending ? "Purged" : isPending ? "Purging…" : "Purge All Cache"}
      </button>
    </div>
  );
}
