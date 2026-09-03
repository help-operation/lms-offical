"use client";

import { Users, UserCheck, CurrencyDollar, WarningCircle, UserMinus } from "@phosphor-icons/react";
import type { EnrichedStudent } from "./types";

type KpiCard = {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  filterKey: string;
  filterValue: string;
};

export function StudentSummaryCards({
  students,
  onFilterClick,
}: {
  students: EnrichedStudent[];
  onFilterClick: (key: string, value: string) => void;
}) {
  const total = students.length;
  const active = students.filter((s) => s.activeStatus === "active").length;
  const due = students.filter((s) => s.paymentStatus === "due").length;
  const noEnrollment = students.filter((s) => s.enrollmentStatus === "none").length;
  const inactive = students.filter((s) => s.activeStatus === "inactive").length;

  const cards: KpiCard[] = [
    {
      label: "Total Students",
      value: total,
      icon: <Users size={18} weight="fill" />,
      color: "text-brand-600",
      bgColor: "bg-brand-100",
      filterKey: "",
      filterValue: "",
    },
    {
      label: "Active",
      value: active,
      icon: <UserCheck size={18} weight="fill" />,
      color: "text-green-600",
      bgColor: "bg-green-100",
      filterKey: "activeStatus",
      filterValue: "active",
    },
    {
      label: "Payment Due",
      value: due,
      icon: <CurrencyDollar size={18} weight="fill" />,
      color: "text-red-600",
      bgColor: "bg-red-100",
      filterKey: "paymentStatus",
      filterValue: "due",
    },
    {
      label: "No Enrollment",
      value: noEnrollment,
      icon: <WarningCircle size={18} weight="fill" />,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      filterKey: "enrollmentStatus",
      filterValue: "none",
    },
    {
      label: "Inactive",
      value: inactive,
      icon: <UserMinus size={18} weight="fill" />,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      filterKey: "activeStatus",
      filterValue: "inactive",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <button
          key={card.label}
          onClick={() => {
            if (card.filterKey) onFilterClick(card.filterKey, card.filterValue);
          }}
          className={`flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 text-left transition-all hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 ${
            card.filterKey ? "cursor-pointer" : "cursor-default"
          }`}
        >
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.bgColor} ${card.color}`}>
            {card.icon}
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{card.value.toLocaleString()}</p>
            <p className="text-[11px] text-gray-500 dark:text-slate-400">{card.label}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
