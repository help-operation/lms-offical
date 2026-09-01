"use client";

import { useEffect, useState } from "react";
import { DataTable, type Column } from "@repo/ui/data-table";
import { dashboardApi, type PerCourseStudentRow } from "../api";

type PerCourseStudentTableRow = Omit<PerCourseStudentRow, "id"> & { id: string };

export function PerCourseStudentList() {
  const [rows, setRows] = useState<PerCourseStudentTableRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .perCourseStudents()
      // Recorded courses and live courses are separate tables with independent id
      // sequences, so a plain `id` can collide across the two — key rows by type+id.
      .then((res) => setRows(res.data.map((r) => ({ ...r, id: `${r.type}-${r.id}` }))))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden relative">
      <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-pink-50/60 to-transparent rounded-bl-full dark:from-pink-500/5" />
      <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-800 relative z-10">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Per Course Student List</h2>
      </div>
      <div className="px-6 pt-5 pb-6 relative z-10">
        <DataTable
          data={rows}
          isLoading={loading}
          searchKeys={["title"]}
          searchPlaceholder="Search by course name..."
          columns={[
            {
              key: "title",
              header: "Course Name",
              render: (r: PerCourseStudentTableRow) => (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-900 dark:text-white">{r.title}</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      r.type === "live" ? "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400" : "bg-pink-50 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400"
                    }`}
                  >
                    {r.type === "live" ? "Live" : "Recorded"}
                  </span>
                </div>
              ),
            },
            {
              key: "students",
              header: "Total Students",
              render: (r: PerCourseStudentTableRow) => <span className="text-xs font-semibold text-gray-900 dark:text-white">{r.students.toLocaleString()}</span>,
            },
          ] as Column<PerCourseStudentTableRow>[]}
          emptyMessage="No courses yet"
          pageSize={10}
        />
      </div>
    </div>
  );
}
