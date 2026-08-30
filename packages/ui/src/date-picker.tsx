"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "../utils";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export interface DatePickerProps {
  /** ISO value: "YYYY-MM-DD" (date) or "YYYY-MM-DDTHH:mm" (when showTime). */
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Show a time field and emit a "YYYY-MM-DDTHH:mm" value. */
  showTime?: boolean;
  /** Disable any day before today. */
  disablePast?: boolean;
  /** Disable any day before this ISO date (e.g. to keep end ≥ start). */
  minDate?: string | null;
  disabled?: boolean;
  className?: string;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const pad = (n: number) => String(n).padStart(2, "0");

function parse(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly)
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function toDateTimeStr(d: Date) {
  return `${toDateStr(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  showTime = false,
  disablePast = false,
  minDate,
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parse(value);

  // Compute the earliest selectable day (latest of today / minDate).
  const mins: Date[] = [];
  if (disablePast) mins.push(startOfToday());
  const md = parse(minDate);
  if (md) mins.push(md);
  const minDay = mins.length
    ? new Date(Math.max(...mins.map((d) => d.getTime())))
    : undefined;
  const disabledDays = minDay ? { before: minDay } : undefined;

  function handleSelect(day: Date | undefined) {
    if (!day) {
      onChange("");
      return;
    }
    if (showTime) {
      const base = selected ?? new Date();
      const merged = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        base.getHours(),
        base.getMinutes(),
      );
      onChange(toDateTimeStr(merged));
    } else {
      onChange(toDateStr(day));
      setOpen(false);
    }
  }

  function handleTime(e: React.ChangeEvent<HTMLInputElement>) {
    const [h, m] = e.target.value.split(":").map(Number);
    const base = selected ?? new Date();
    const merged = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate(),
      h || 0,
      m || 0,
    );
    onChange(toDateTimeStr(merged));
  }

  const label = selected
    ? selected.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) +
      (showTime
        ? ` · ${selected.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
        : "")
    : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm outline-none transition-colors focus:border-violet-400 disabled:cursor-not-allowed disabled:opacity-60",
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-gray-400" />
          <span className={cn("flex-1 truncate", !label && "text-gray-400")}>
            {label || placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[90] w-auto rounded-lg border border-gray-200 bg-white p-0 text-gray-900 shadow-lg"
        align="start"
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          disabled={disabledDays}
          autoFocus
        />
        {showTime && (
          <div className="flex items-center gap-2 border-t border-gray-100 px-3 py-2">
            <span className="text-xs font-medium text-gray-500">Time</span>
            <input
              type="time"
              value={selected ? `${pad(selected.getHours())}:${pad(selected.getMinutes())}` : ""}
              onChange={handleTime}
              className="rounded-md border border-gray-200 px-2 py-1 text-sm outline-none focus:border-violet-400"
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
