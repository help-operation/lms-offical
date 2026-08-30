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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">System Health</h2>
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full ${
            healthy ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
          }`}
        >
          <Activity className="h-3 w-3" />
          {health ? (healthy ? "Healthy" : "Degraded") : "Checking..."}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-gray-50 dark:bg-slate-800 p-3">
          <Gauge className="h-4 w-4 text-brand-500 dark:text-brand mb-1.5" />
          <p className="text-[11px] text-gray-500 dark:text-slate-400">API Response</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{health ? `${health.apiPingMs} ms` : "—"}</p>
        </div>
        <div className="rounded-xl bg-gray-50 dark:bg-slate-800 p-3">
          <Activity className="h-4 w-4 text-green-500 mb-1.5" />
          <p className="text-[11px] text-gray-500 dark:text-slate-400">Server Uptime</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{health?.uptime ?? "—"}</p>
        </div>
        <div className="rounded-xl bg-gray-50 dark:bg-slate-800 p-3">
          <HardDrive className="h-4 w-4 text-blue-500 mb-1.5" />
          <p className="text-[11px] text-gray-500 dark:text-slate-400">Storage</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{health ? `${health.storageGb} GB` : "—"}</p>
        </div>
      </div>
    </div>
  );
}
