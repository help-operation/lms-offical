"use client";

import { createContext, useContext, useMemo } from "react";
import {
  formatDate as formatDateWith,
  formatDateTime as formatDateTimeWith,
  formatTime as formatTimeWith,
  type LocalizationSettings,
} from "@/shared/utils/date";

interface LocalizationContextValue extends LocalizationSettings {
  formatDate: (value: Date | string | null | undefined) => string;
  formatDateTime: (value: Date | string | null | undefined) => string;
  formatTime: (value: Date | string | null | undefined) => string;
}

const DEFAULTS: LocalizationSettings = {
  timezone: "Asia/Dhaka",
  dateFormat: "dd_mmm_yyyy",
  timeFormat: "12h",
};

const LocalizationContext = createContext<LocalizationContextValue>({
  ...DEFAULTS,
  formatDate: (v) => formatDateWith(v, DEFAULTS),
  formatDateTime: (v) => formatDateTimeWith(v, DEFAULTS),
  formatTime: (v) => formatTimeWith(v, DEFAULTS),
});

interface Props extends LocalizationSettings {
  children: React.ReactNode;
}

export function LocalizationProvider({ timezone, dateFormat, timeFormat, children }: Props) {
  const value = useMemo<LocalizationContextValue>(() => {
    const settings: LocalizationSettings = { timezone, dateFormat, timeFormat };
    return {
      ...settings,
      formatDate: (v) => formatDateWith(v, settings),
      formatDateTime: (v) => formatDateTimeWith(v, settings),
      formatTime: (v) => formatTimeWith(v, settings),
    };
  }, [timezone, dateFormat, timeFormat]);

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  return useContext(LocalizationContext);
}
