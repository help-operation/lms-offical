"use client";

import { useEffect, useState } from "react";
import { Activity, Gauge, HardDrive } from "lucide-react";
import { dashboardApi, type SystemHealth } from "../api";

const POLL_MS = 30_000;

export function SystemHealthCard() {
  const [health, setHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchHealth = () => {
      dashboardApi
        .systemHealth()
        .then((res) => {
          if (!cancelled) setHealth(res.data);
        })
        .catch(() => {});
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const healthy = health?.status === "healthy";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-emerald-50/60 to-transparent rounded-bl-full dark:from-emerald-500/5" />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">System Health</h2>
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm ${
            healthy ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" : "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
          }`}
        >
          <Activity className="h-3 w-3" />
          {health ? (healthy ? "Healthy" : "Degraded") : "Checking..."}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 relative z-10">
        <div className="rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/50 dark:from-brand-500/10 dark:to-brand-500/5 p-3 border border-brand-100/50 dark:border-brand-500/10">
          <Gauge className="h-4 w-4 text-brand-500 dark:text-brand mb-1.5" />
          <p className="text-[11px] text-brand-600/70 dark:text-slate-400 font-medium">API Response</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{health ? `${health.apiPingMs} ms` : "—"}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5 p-3 border border-emerald-100/50 dark:border-emerald-500/10">
          <Activity className="h-4 w-4 text-emerald-500 mb-1.5" />
          <p className="text-[11px] text-emerald-600/70 dark:text-slate-400 font-medium">Server Uptime</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{health?.uptime ?? "—"}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-500/10 dark:to-blue-500/5 p-3 border border-blue-100/50 dark:border-blue-500/10">
          <HardDrive className="h-4 w-4 text-blue-500 mb-1.5" />
          <p className="text-[11px] text-blue-600/70 dark:text-slate-400 font-medium">Storage</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{health ? `${health.storageGb} GB` : "—"}</p>
        </div>
      </div>
    </div>
  );
}
