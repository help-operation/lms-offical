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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-800">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Per Course Student List</h2>
      </div>
      <div className="px-6 pt-5 pb-6">
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
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      r.type === "live" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" : "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400"
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
