"use client";

import { useId, useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "../utils";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

export interface DateRangePickerProps {
  value?: DateRange | null;
  onChange?: (range: DateRange | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Element to portal the popover into (defaults to document.body). Pass a
   *  scoped ancestor when the app's dark mode is toggled via a class on a
   *  wrapper div rather than <html> — otherwise the portaled popover renders
   *  outside that scope and never picks up dark: styles. */
  portalContainer?: HTMLElement | null;
}

// ── Date utilities ─────────────────────────────────────────────────────────────

const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MNAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayStr(): string {
  return toStr(new Date());
}

function shiftDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toStr(d);
}

function formatDisplay(s: string): string {
  if (!s) return "";
  const [y, m, d] = s.split("-").map(Number) as [number, number, number];
  return `${MNAMES[m - 1]!.slice(0, 3)} ${d}, ${y}`;
}

function buildGrid(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const grid: (string | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) grid.push(null);
  for (let d = 1; d <= last.getDate(); d++) grid.push(toStr(new Date(year, month, d)));
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

function prevMo(year: number, month: number): [number, number] {
  const d = new Date(year, month - 1, 1);
  return [d.getFullYear(), d.getMonth()];
}

function nextMo(year: number, month: number): [number, number] {
  const d = new Date(year, month + 1, 1);
  return [d.getFullYear(), d.getMonth()];
}

// ── Presets ────────────────────────────────────────────────────────────────────

function makePresets() {
  const now = new Date();
  const t = toStr(now);
  const wStart = new Date(now); wStart.setDate(now.getDate() - now.getDay());
  const wEnd   = new Date(now); wEnd.setDate(now.getDate() + (6 - now.getDay()));
  const lwEnd  = new Date(now); lwEnd.setDate(now.getDate() - now.getDay() - 1);
  const lwStart = new Date(lwEnd); lwStart.setDate(lwEnd.getDate() - 6);
  const mStart  = new Date(now.getFullYear(), now.getMonth(), 1);
  const mEnd    = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lmEnd   = new Date(now.getFullYear(), now.getMonth(), 0);
  return [
    { label: "Today",        from: t,              to: t              },
    { label: "Yesterday",    from: shiftDays(-1),   to: shiftDays(-1)  },
    { label: "Last 7 days",  from: shiftDays(-6),   to: t              },
    { label: "Last 14 days", from: shiftDays(-13),  to: t              },
    { label: "Last 30 days", from: shiftDays(-29),  to: t              },
    { label: "This week",    from: toStr(wStart),   to: toStr(wEnd)    },
    { label: "Last week",    from: toStr(lwStart),  to: toStr(lwEnd)   },
    { label: "This month",   from: toStr(mStart),   to: toStr(mEnd)    },
    { label: "Last month",   from: toStr(lmStart),  to: toStr(lmEnd)   },
  ];
}

// ── Calendar month grid ────────────────────────────────────────────────────────

interface CalMonthProps {
  year: number;
  month: number;
  previewFrom: string;
  previewTo: string;
  onDayClick: (d: string) => void;
  onDayHover: (d: string) => void;
}

function CalMonth({ year, month, previewFrom, previewTo, onDayClick, onDayHover }: CalMonthProps) {
  const grid = buildGrid(year, month);
  const today = todayStr();
  const sameDay = previewFrom !== "" && previewFrom === previewTo;

  return (
    <div className="select-none w-[196px]">
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7">
        {DOW.map((d) => (
          <div key={d} className="h-7 flex items-center justify-center text-[11px] font-medium text-gray-400 dark:text-slate-500">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {grid.map((dayStr, i) => {
          if (!dayStr) return <div key={`e-${i}`} className="h-8" />;

          const isStart = dayStr === previewFrom && previewFrom !== "";
          const isEnd   = dayStr === previewTo   && previewTo   !== "" && !sameDay;
          const inRange = !!(previewFrom && previewTo && dayStr > previewFrom && dayStr < previewTo);
          const isToday = dayStr === today;

          const stripeBg: React.CSSProperties =
            isStart && previewTo && !sameDay
              ? { background: "linear-gradient(to right, transparent 50%, var(--range-highlight, #ede9fe) 50%)" }
              : isEnd
              ? { background: "linear-gradient(to left, transparent 50%, var(--range-highlight, #ede9fe) 50%)" }
              : inRange
              ? { backgroundColor: "var(--range-highlight, #ede9fe)" }
              : {};

          return (
            <div
              key={dayStr}
              className="h-8 flex items-center justify-center"
              style={stripeBg}
            >
              <button
                onClick={() => onDayClick(dayStr)}
                onMouseEnter={() => onDayHover(dayStr)}
                className={cn(
                  "cursor-pointer h-8 w-8 rounded-full flex items-center justify-center text-sm transition-colors",
                  (isStart || isEnd) && "bg-violet-600 dark:bg-brand text-white font-semibold",
                  !isStart && !isEnd && isToday  && "ring-1 ring-violet-500 dark:ring-brand text-violet-700 dark:text-brand font-medium",
                  !isStart && !isEnd && !isToday && "text-gray-700 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-brand/15",
                )}
              >
                {new Date(dayStr + "T00:00:00").getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Select date range",
  disabled = false,
  className,
  portalContainer,
}: DateRangePickerProps) {
  const now = new Date();
  const contentId = `drp-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  // Left calendar initial position
  const initYear  = value?.from ? parseInt(value.from.slice(0, 4))     : now.getFullYear();
  const initMonth = value?.from ? parseInt(value.from.slice(5, 7)) - 1 : now.getMonth();

  const [open, setOpen]     = useState(false);
  const [lYear, setLYear]   = useState(initYear);
  const [lMonth, setLMonth] = useState(initMonth);

  // Draft state while popover is open (committed on Update)
  const [draftFrom, setDraftFrom] = useState(value?.from ?? "");
  const [draftTo,   setDraftTo]   = useState(value?.to   ?? "");
  const [stage,  setStage]        = useState<"idle" | "second">("idle");
  const [hover,  setHover]        = useState("");

  const [rYear, rMonth] = nextMo(lYear, lMonth);

  // Effective range for calendar highlighting (includes hover preview)
  const previewFrom =
    stage === "second" && hover
      ? hover < draftFrom ? hover : draftFrom
      : draftFrom;
  const previewTo =
    stage === "second" && hover
      ? hover >= draftFrom ? hover : draftFrom
      : draftTo;

  function handleOpenChange(v: boolean) {
    if (v) {
      setDraftFrom(value?.from ?? "");
      setDraftTo(value?.to   ?? "");
      setStage("idle");
      setHover("");
      const d = value?.from ? new Date(value.from + "T00:00:00") : new Date();
      setLYear(d.getFullYear());
      setLMonth(d.getMonth());
    }
    setOpen(v);
  }

  function handleDayClick(d: string) {
    if (stage === "idle") {
      setDraftFrom(d);
      setDraftTo("");
      setStage("second");
    } else {
      const from = d < draftFrom ? d : draftFrom;
      const to   = d < draftFrom ? draftFrom : d;
      setDraftFrom(from);
      setDraftTo(to);
      setStage("idle");
      setHover("");
    }
  }

  function handlePreset(from: string, to: string) {
    setDraftFrom(from);
    setDraftTo(to);
    setStage("idle");
    setHover("");
    const d = new Date(from + "T00:00:00");
    setLYear(d.getFullYear());
    setLMonth(d.getMonth());
  }

  function handleCancel() {
    setOpen(false);
  }

  function handleUpdate() {
    if (draftFrom && draftTo) {
      onChange?.({ from: draftFrom, to: draftTo });
    } else if (!draftFrom && !draftTo) {
      onChange?.(null);
    }
    setOpen(false);
  }

  const displayText =
    value?.from && value?.to
      ? `${formatDisplay(value.from)} → ${formatDisplay(value.to)}`
      : null;

  const presets = makePresets();

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <PopoverPrimitive.Trigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "cursor-pointer inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm shadow-sm hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
            displayText ? "text-gray-800 dark:text-slate-100" : "text-gray-400 dark:text-slate-500",
            className,
          )}
        >
          <Calendar size={15} className="shrink-0 text-gray-400 dark:text-slate-500" />
          <span className={cn("text-sm", displayText ? "font-medium text-gray-800 dark:text-slate-100" : "text-gray-400 dark:text-slate-500")}>
            {displayText ?? placeholder}
          </span>
          {displayText && (
            <X
              size={14}
              className="ml-1 shrink-0 cursor-pointer text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
              onClick={(e) => {
                e.stopPropagation();
                onChange?.(null);
              }}
            />
          )}
        </button>
      </PopoverPrimitive.Trigger>

      {/* Radix positions the *wrapper* div (data-radix-popper-content-wrapper),
          not the Content div our className lands on — so overriding position on
          mobile has to target that wrapper directly via this scoped selector.
          Rendered outside the Portal since Portal requires exactly one child
          (it uses Slot's asChild internally) and CSS doesn't need to be portaled. */}
      <style>{`
        @media (max-width: 767px) {
          [data-radix-popper-content-wrapper]:has(#${contentId}) {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            right: auto !important;
            bottom: auto !important;
            transform: translate(-50%, -50%) !important;
          }
        }
      `}</style>

      <PopoverPrimitive.Portal container={portalContainer}>
        <PopoverPrimitive.Content
          id={contentId}
          align="end"
          sideOffset={6}
          collisionPadding={16}
          onMouseLeave={() => stage === "second" && setHover("")}
          className="z-50 w-[calc(100vw-2rem)] max-w-[300px] md:w-auto md:max-w-none max-h-[85vh] overflow-y-auto rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl outline-none"
        >
          {/* ── Top date inputs ─────────────────────────────────────────── */}
          <div className="flex flex-nowrap items-center gap-1.5 border-b border-gray-100 dark:border-slate-800 pl-5 pr-4 py-3">
            <input
              type="date"
              value={draftFrom}
              max={draftTo || undefined}
              onChange={(e) => { setDraftFrom(e.target.value); setStage("idle"); }}
              className="min-w-0 flex-1 cursor-pointer rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm text-gray-700 dark:text-slate-200 focus:border-violet-400 dark:focus:border-brand focus:outline-none focus:ring-2 focus:ring-violet-100 dark:focus:ring-brand/20"
            />
            <span className="shrink-0 text-gray-400 dark:text-slate-500 font-medium">–</span>
            <input
              type="date"
              value={draftTo}
              min={draftFrom || undefined}
              onChange={(e) => { setDraftTo(e.target.value); setStage("idle"); }}
              className="min-w-0 flex-1 cursor-pointer rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm text-gray-700 dark:text-slate-200 focus:border-violet-400 dark:focus:border-brand focus:outline-none focus:ring-2 focus:ring-violet-100 dark:focus:ring-brand/20"
            />
          </div>

          <div className="flex flex-col md:flex-row">
            {/* ── Calendars ──────────────────────────────────────────────── */}
            <div className="pl-5 pr-4 py-4">
              {/* Month navigation bar */}
              <div className="mb-3 flex items-center">
                <button
                  onClick={() => { const [y, m] = prevMo(lYear, lMonth); setLYear(y); setLMonth(m); }}
                  className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-md text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="flex flex-1 px-1">
                  <div className="flex-1 text-center text-sm font-semibold text-gray-800 dark:text-slate-100">
                    {MNAMES[lMonth]} {lYear}
                  </div>
                  <div className="hidden md:block flex-1 text-center text-sm font-semibold text-gray-800 dark:text-slate-100">
                    {MNAMES[rMonth]} {rYear}
                  </div>
                </div>

                <button
                  onClick={() => { const [y, m] = nextMo(lYear, lMonth); setLYear(y); setLMonth(m); }}
                  className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-md text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Calendar(s) — single month on small screens, dual on md+ */}
              <div className="flex gap-6">
                <CalMonth
                  year={lYear}
                  month={lMonth}
                  previewFrom={previewFrom}
                  previewTo={previewTo}
                  onDayClick={handleDayClick}
                  onDayHover={(d) => stage === "second" && setHover(d)}
                />
                <div className="hidden md:block">
                  <CalMonth
                    year={rYear}
                    month={rMonth}
                    previewFrom={previewFrom}
                    previewTo={previewTo}
                    onDayClick={handleDayClick}
                    onDayHover={(d) => stage === "second" && setHover(d)}
                  />
                </div>
              </div>
            </div>

            {/* ── Presets ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:flex md:flex-col gap-1 md:gap-0.5 w-full md:w-36 max-h-32 md:max-h-none overflow-y-auto md:overflow-visible border-t md:border-t-0 md:border-l border-gray-100 dark:border-slate-800 p-3">
              {presets.map((p) => {
                const active = p.from === draftFrom && p.to === draftTo;
                return (
                  <button
                    key={p.label}
                    onClick={() => handlePreset(p.from, p.to)}
                    className={cn(
                      "cursor-pointer rounded-md px-3 py-1.5 text-left text-sm transition-colors",
                      active
                        ? "bg-violet-50 dark:bg-brand/15 text-violet-700 dark:text-brand font-semibold"
                        : "text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-slate-100",
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 dark:border-slate-800 pl-5 pr-4 py-3">
            <button
              onClick={handleCancel}
              className="cursor-pointer rounded-lg border border-gray-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={!draftFrom || !draftTo}
              className="cursor-pointer rounded-lg bg-violet-600 dark:bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 dark:hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Update
            </button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
