"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "../utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * Calendar built on react-day-picker v9. Styled with Tailwind via the v9
 * `classNames` keys (no external stylesheet needed).
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "relative flex flex-col gap-4 sm:flex-row",
        month: "space-y-4",
        month_caption: "relative flex h-9 items-center justify-center",
        caption_label: "text-sm font-medium",
        nav: "absolute inset-x-0 top-1 z-10 flex items-center justify-between px-1",
        button_previous:
          "inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white p-0 text-gray-600 hover:bg-gray-100",
        button_next:
          "inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white p-0 text-gray-600 hover:bg-gray-100",
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "w-9 rounded-md text-[0.8rem] font-normal text-gray-400",
        week: "mt-2 flex w-full",
        day: "relative h-9 w-9 p-0 text-center text-sm",
        day_button:
          "inline-flex h-9 w-9 items-center justify-center rounded-md p-0 text-sm font-normal text-gray-700 hover:bg-gray-100 aria-selected:opacity-100",
        selected:
          "[&>button]:bg-violet-600 [&>button]:text-white [&>button:hover]:bg-violet-600 [&>button:hover]:text-white",
        today: "[&>button]:bg-gray-100 [&>button]:font-semibold",
        outside: "[&>button]:text-gray-300",
        disabled: "[&>button]:text-gray-300 [&>button]:opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: cls }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("h-4 w-4", cls)} />
          ) : (
            <ChevronRight className={cn("h-4 w-4", cls)} />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
