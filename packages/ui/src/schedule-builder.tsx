"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "../utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export interface ScheduleBuilderProps {
  /**
   * Canonical readable value, e.g. "Sat, Sun · 9:00 AM – 11:00 AM" or
   * "Daily · 10:00 AM – 6:00 PM". Legacy free-text that doesn't match this
   * shape won't pre-fill (admin rebuilds it once).
   */
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface State {
  daily: boolean;
  days: number[];
  start: string; // "HH:mm"
  end: string; // "HH:mm"
}

// ── 24h "HH:mm" → "h:mm AM/PM" ──────────────────────────────────────────────
function fmtTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  if (Number.isNaN(h)) return "";
  const m = Number.isNaN(Number(mStr)) ? 0 : Number(mStr);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ── "h:mm AM/PM" → "HH:mm" ──────────────────────────────────────────────────
function parse12(str: string): string {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(str.trim());
  if (!m) return "";
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3]!)) h += 12;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

function build({ daily, days, start, end }: State): string {
  const daysPart = daily
    ? "Daily"
    : DAY_NAMES.filter((_, i) => days.includes(i)).join(", ");
  const timePart =
    start && end ? `${fmtTime(start)} – ${fmtTime(end)}` : start ? fmtTime(start) : "";
  return [daysPart, timePart].filter(Boolean).join(" · ");
}

function parseValue(value?: string | null): State {
  const res: State = { daily: false, days: [], start: "", end: "" };
  if (!value) return res;
  for (const part of value.split(" · ")) {
    const p = part.trim();
    if (/^daily$/i.test(p)) {
      res.daily = true;
    } else if (/(am|pm)/i.test(p)) {
      const range = /(\d{1,2}:\d{2}\s*(?:AM|PM))\s*[–-]\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i.exec(p);
      if (range) {
        res.start = parse12(range[1]!);
        res.end = parse12(range[2]!);
      } else {
        const single = /(\d{1,2}:\d{2}\s*(?:AM|PM))/i.exec(p);
        if (single) res.start = parse12(single[1]!);
      }
    } else {
      for (const name of p.split(",")) {
        const idx = DAY_NAMES.findIndex((d) => d.toLowerCase() === name.trim().toLowerCase());
        if (idx >= 0 && !res.days.includes(idx)) res.days.push(idx);
      }
    }
  }
  return res;
}

export function ScheduleBuilder({
  value,
  onChange,
  placeholder = "Pick days & time",
  className,
}: ScheduleBuilderProps) {
  const [st, setSt] = React.useState<State>(() => parseValue(value));

  function update(next: State) {
    setSt(next);
    onChange(build(next));
  }

  const timeInput =
    "rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-violet-400";

  const label = build(st);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm outline-none transition-colors focus:border-violet-400",
            className,
          )}
        >
          <Clock className="h-4 w-4 shrink-0 text-gray-400" />
          <span className={cn("flex-1 truncate", !label && "text-gray-400")}>
            {label || placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[90] w-auto max-w-[20rem] space-y-3 rounded-lg border border-gray-200 bg-white p-3 text-gray-900 shadow-lg"
        align="start"
      >
        {/* Days */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => update({ ...st, daily: !st.daily, days: [] })}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              st.daily
                ? "bg-violet-600 text-white"
                : "border border-gray-200 text-gray-600 hover:bg-gray-50",
            )}
          >
            Daily
          </button>
          <span className="mx-1 text-xs text-gray-300">|</span>
          {DAY_NAMES.map((d, i) => {
            const active = !st.daily && st.days.includes(i);
            return (
              <button
                key={d}
                type="button"
                disabled={st.daily}
                onClick={() =>
                  update({
                    ...st,
                    daily: false,
                    days: st.days.includes(i)
                      ? st.days.filter((x) => x !== i)
                      : [...st.days, i],
                  })
                }
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? "bg-violet-600 text-white"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50",
                  st.daily && "opacity-40",
                )}
              >
                {d}
              </button>
            );
          })}
        </div>

        {/* Time range */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="text-xs font-medium">From</span>
          <input
            type="time"
            value={st.start}
            onChange={(e) => update({ ...st, start: e.target.value })}
            className={timeInput}
          />
          <span className="text-xs font-medium">to</span>
          <input
            type="time"
            value={st.end}
            onChange={(e) => update({ ...st, end: e.target.value })}
            className={timeInput}
          />
        </div>

        {/* Preview */}
        <p className="text-xs text-gray-400">
          {label ? (
            <>Saved as: <span className="font-medium text-gray-600">{label}</span></>
          ) : (
            "Pick days and a time range"
          )}
        </p>
      </PopoverContent>
    </Popover>
  );
}
