/**
 * Admin-dashboard date/time display formatting, driven by the Localization
 * settings (timezone, date format, time format) configured in
 * Admin → Settings → General. Dates are always stored/transmitted as UTC —
 * only how they're *displayed* here changes. Not used by the student-facing
 * web app, which has no such setting.
 */

export type DateFormatToken = "dd_mmm_yyyy" | "dd_mm_yyyy" | "mm_dd_yyyy" | "yyyy_mm_dd";
export type TimeFormatToken = "12h" | "24h";

export interface LocalizationSettings {
  timezone: string;
  dateFormat: DateFormatToken | string;
  timeFormat: TimeFormatToken | string;
}

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/** Timezone-correct y/m/d/h/m parts, extracted safely via Intl (no manual UTC-offset math). */
function getParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") === "24" ? "00" : get("hour"),
    minute: get("minute"),
  };
}

function assembleDate(p: ReturnType<typeof getParts>, format: string): string {
  const monthAbbr = MONTH_ABBR[Number(p.month) - 1] ?? p.month;
  switch (format) {
    case "dd_mm_yyyy":
      return `${p.day}/${p.month}/${p.year}`;
    case "mm_dd_yyyy":
      return `${p.month}/${p.day}/${p.year}`;
    case "yyyy_mm_dd":
      return `${p.year}-${p.month}-${p.day}`;
    case "dd_mmm_yyyy":
    default:
      return `${p.day} ${monthAbbr} ${p.year}`;
  }
}

function assembleTime(p: ReturnType<typeof getParts>, format: string): string {
  if (format === "24h") return `${p.hour}:${p.minute}`;
  const h24 = Number(p.hour);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const suffix = h24 < 12 ? "AM" : "PM";
  return `${h12}:${p.minute} ${suffix}`;
}

export function formatDate(
  value: Date | string | null | undefined,
  settings: LocalizationSettings,
): string {
  const date = toDate(value);
  if (!date) return "—";
  return assembleDate(getParts(date, settings.timezone), settings.dateFormat);
}

export function formatTime(
  value: Date | string | null | undefined,
  settings: LocalizationSettings,
): string {
  const date = toDate(value);
  if (!date) return "—";
  return assembleTime(getParts(date, settings.timezone), settings.timeFormat);
}

export function formatDateTime(
  value: Date | string | null | undefined,
  settings: LocalizationSettings,
): string {
  const date = toDate(value);
  if (!date) return "—";
  const parts = getParts(date, settings.timezone);
  return `${assembleDate(parts, settings.dateFormat)}, ${assembleTime(parts, settings.timeFormat)}`;
}
