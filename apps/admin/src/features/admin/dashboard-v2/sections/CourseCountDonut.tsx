import type { DashboardOverview } from "../api";
import { Donut } from "../shared/donut";

export function CourseCountDonut({ data }: { data: DashboardOverview["courseCount"] }) {
  return (
    <Donut
      title="Course Count"
      centerLabel="Total Courses"
      slices={[
        { label: "Live Course", value: data.live, color: "#10b981" },
        { label: "Recorded Course", value: data.recorded, color: "#a64dff" },
        { label: "Free Course", value: data.free, color: "#f59e0b" },
      ]}
    />
  );
}
