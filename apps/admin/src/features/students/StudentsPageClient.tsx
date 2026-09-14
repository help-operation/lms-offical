"use client";

import { useState } from "react";
import { StudentsClient } from "./StudentsClient";
import { GuestsClient } from "./GuestsClient";
import type { Student } from "./types";
import type { PaginatedResponse } from "@/features/admin/api";

interface Props {
  studentsData: PaginatedResponse<Student>;
  studentsStats?: {
    total: number;
    active: number;
    suspended: number;
    newThisMonth: number;
    onlineNow: number;
  };
}

export function StudentsPageClient({ studentsData, studentsStats }: Props) {
  const [tab, setTab] = useState<"students" | "guests">("students");

  if (tab === "guests") {
    return <GuestsClient onTabChange={setTab} />;
  }

  return <StudentsClient initialData={studentsData} initialStats={studentsStats} onTabChange={setTab} />;
}
