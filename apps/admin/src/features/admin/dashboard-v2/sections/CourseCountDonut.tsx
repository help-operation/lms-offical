import type { DashboardOverview } from "../api";
import { Donut } from "../shared/donut";

export function CourseCountDonut({ data }: { data: DashboardOverview["courseCount"] }) {
  return (
    <Donut
      title="Course Count"
      centerLabel="Total Courses"
      slices={[
        { label: "Live Course", value: data.live, color: "#22c55e" },
        { label: "Recorded Course", value: data.recorded, color: "#7c3aed" },
        { label: "Free Course", value: data.free, color: "#f59e0b" },
      ]}
    />
  );
}
