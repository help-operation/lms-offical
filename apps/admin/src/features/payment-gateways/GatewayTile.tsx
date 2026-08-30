"use client";

import { motion } from "framer-motion";
import { CheckCircle, CaretRight, Star } from "@phosphor-icons/react";
import type { AdminGatewayView } from "./api";
import { getGatewayMeta } from "./gateway-meta";

interface Props {
  gateway: AdminGatewayView;
  index: number;
  onOpen: () => void;
}

export function GatewayTile({ gateway, index, onOpen }: Props) {
  const meta = getGatewayMeta(gateway.id);
  const Icon = meta.icon;

  const setCount = gateway.fields.filter((f) => (f.secret ? f.isSet : f.value?.trim())).length;
  const isComplete = setCount === gateway.fields.length;
  const percent = Math.round((setCount / gateway.fields.length) * 100);

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.03, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:border-transparent hover:shadow-xl hover:shadow-gray-200/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-black/40"
    >
      <span
        className={`absolute inset-x-0 top-0 h-1 scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${meta.color.text} ${meta.color.darkText} bg-current`}
      />

      <div className="flex items-center gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg shadow-sm ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-105 dark:ring-white/10 ${meta.color.bg} ${meta.color.text} ${meta.color.darkBg} ${meta.color.darkText}`}
        >
          <Icon size={22} weight="fill" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{gateway.name}</h3>
            {gateway.isActive && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-green-100 bg-green-50 px-1.5 py-0.5 text-[9px] font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300">
                <Star size={8} weight="fill" /> Active
              </span>
            )}
          </div>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{meta.description}</p>
        </div>
        <CaretRight
          size={14}
          weight="bold"
          className="shrink-0 text-gray-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-brand-500 dark:text-slate-600 dark:group-hover:text-brand-400"
        />
      </div>

      <div className="mt-4 flex items-center gap-2 text-[11px] font-medium">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${gateway.enabled ? "bg-green-500" : "bg-gray-300 dark:bg-slate-600"}`} />
        <span className="text-gray-400 dark:text-slate-500">
          {gateway.enabled ? "Enabled" : "Disabled — hidden from checkout"}
        </span>
      </div>

      <div className="mt-2.5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isComplete ? "bg-green-500 dark:bg-green-400" : "bg-brand-500 dark:bg-brand-400"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] font-medium text-gray-400 dark:text-slate-500">
          <span className="inline-flex items-center gap-1">
            {isComplete && <CheckCircle size={11} weight="fill" className="text-green-500 dark:text-green-400" />}
            {setCount}/{gateway.fields.length} fields
          </span>
          <span>{percent}%</span>
        </div>
      </div>
    </motion.button>
  );
}
