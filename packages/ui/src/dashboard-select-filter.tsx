"use client";

export interface DashboardSelectFilterOption {
  value: string;
  label: string;
}

export interface DashboardSelectFilterProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: DashboardSelectFilterOption[];
  /** Defaults to "All {label}". */
  allLabel?: string;
}

export function DashboardSelectFilter({ label, value, onChange, options, allLabel }: DashboardSelectFilterProps) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="cursor-pointer text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-violet-300"
    >
      <option value="all">{allLabel ?? `All ${label}`}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
