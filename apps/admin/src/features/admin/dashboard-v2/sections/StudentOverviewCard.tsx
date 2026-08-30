import { Users, UserCheck, Award, Video, BookOpen, Gift, UserMinus } from "lucide-react";
import type { DashboardOverview } from "../api";
import { StatCardGrid, type StatCardDef } from "../shared/stat-card";

export function StudentOverviewCard({ data }: { data: DashboardOverview["studentOverview"] }) {
  const cards: StatCardDef[] = [
    { label: "Total Students", value: data.totalStudents.toLocaleString(), icon: Users, iconBg: "bg-brand-100", iconColor: "text-brand-600" },
    { label: "Active Students", value: data.activeStudents.toLocaleString(), icon: UserCheck, iconBg: "bg-green-100", iconColor: "text-green-600" },
    { label: "Total Certified Students", value: data.totalCertified.toLocaleString(), icon: Award, iconBg: "bg-amber-100", iconColor: "text-amber-600" },
    { label: "Live Course Students", value: data.liveCourseStudents.toLocaleString(), icon: Video, iconBg: "bg-pink-100", iconColor: "text-pink-600" },
    { label: "Recorded Course Students", value: data.recordedCourseStudents.toLocaleString(), icon: BookOpen, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
    { label: "Free Course Students", value: data.freeCourseStudents.toLocaleString(), icon: Gift, iconBg: "bg-teal-100", iconColor: "text-teal-600" },
    { label: "Dropout Students", value: data.dropoutStudents.toLocaleString(), icon: UserMinus, iconBg: "bg-red-100", iconColor: "text-red-600" },
  ];

  return <StatCardGrid title="Student Overview" accentColor="text-brand-600" cards={cards} />;
}
