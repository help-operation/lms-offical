import type { DashboardOverview } from "../api";
import { Donut } from "../shared/donut";

const SOURCE_META: Record<string, { label: string; color: string }> = {
  facebook: { label: "Facebook", color: "#1877f2" },
  youtube: { label: "YouTube", color: "#ff0000" },
  website: { label: "Website", color: "#a64dff" },
  linkedin: { label: "LinkedIn", color: "#0a66c2" },
  twitter: { label: "Twitter / X", color: "#111827" },
  instagram: { label: "Instagram", color: "#e1306c" },
  direct: { label: "Direct", color: "#10b981" },
  other: { label: "Others", color: "#94a3b8" },
};

export function VisitorSourceDonut({ data }: { data: DashboardOverview["visitorSource"] }) {
  const slices = Object.entries(SOURCE_META).map(([key, meta]) => ({
    label: meta.label,
    value: data.bySource[key] ?? 0,
    color: meta.color,
  }));

  return <Donut title="Visitor Source" centerLabel="Total Visitors" slices={slices} />;
}
