import type { DashboardOverview } from "../api";
import { Donut } from "../shared/donut";

export function DeviceDonut({ data }: { data: DashboardOverview["devices"] }) {
  const desktop = (data.desktop ?? 0) + (data.tablet ?? 0);
  const mobile = data.mobile ?? 0;
  return (
    <Donut
      title="Devices"
      centerLabel="Total Visits"
      slices={[
        { label: "Mobile", value: mobile, color: "#7c3aed" },
        { label: "Computer / Laptop", value: desktop, color: "#3b82f6" },
      ]}
    />
  );
}

export function GenderDonut({ data }: { data: DashboardOverview["gender"] }) {
  return (
    <Donut
      title="Gender"
      centerLabel="Total Students"
      slices={[
        { label: "Male", value: data.male ?? 0, color: "#3b82f6" },
        { label: "Female", value: data.female ?? 0, color: "#ec4899" },
        { label: "Other", value: data.other ?? 0, color: "#f59e0b" },
        { label: "Not specified", value: data.not_specified ?? 0, color: "#9ca3af" },
      ]}
    />
  );
}
