"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ChevronLeft, BookOpen, GraduationCap, Mail, Phone,
  Pencil, Globe, Link2, ShieldOff, ShieldCheck, Trash2,
} from "lucide-react";
import { toast } from "@repo/ui/sonner";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { EditPersonModal } from "@/shared/components/EditPersonModal";
import {
  toggleStudentStatusAction,
  updateStudentAction,
  resetStudentPasswordAction,
  deleteStudentAction,
} from "@/features/students/actions/students.actions";
import { DataTable, type Column } from "@repo/ui/data-table";
import type { StudentDetail, StudentEnrollment } from "./types";
import { useLocalization } from "@/shared/context/LocalizationContext";

interface Props { student: StudentDetail }

const avatarColors = ["bg-blue-400", "bg-violet-400", "bg-emerald-400", "bg-amber-400"];

const ENROLLMENT_STATUS_STYLES: Record<string, string> = {
  active:    "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  refunded:  "bg-gray-100 text-gray-500",
};

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  website:  Globe,
};

function getEnrollmentColumns(formatDate: (d: string | Date) => string): Column<StudentEnrollment>[] {
  return [
  {
    key: "courseTitle", header: "Course", sortable: true,
    render: (e) => (
      <div className="flex items-center gap-3">
        {e.courseThumbnail ? (
          <img src={e.courseThumbnail} alt={e.courseTitle} className="h-10 w-14 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="h-10 w-14 rounded-lg bg-gray-100 dark:bg-slate-800 shrink-0 flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-gray-300 dark:text-slate-600" />
          </div>
        )}
        <p className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-[220px]">{e.courseTitle}</p>
      </div>
    ),
  },
  {
    key: "status", header: "Status",
    render: (e) => (
      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${ENROLLMENT_STATUS_STYLES[e.status] ?? "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400"}`}>
        {e.status}
      </span>
    ),
  },
  {
    key: "completedLessons", header: "Progress",
    render: (e) => {
      const progress = e.totalLessons > 0 ? Math.round((e.completedLessons / e.totalLessons) * 100) : 0;
      return (
        <div className="flex items-center gap-2 min-w-[140px]">
          <div className="h-1.5 w-24 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden shrink-0">
            <div
              className={`h-full rounded-full transition-all ${e.status === "completed" ? "bg-green-500 dark:bg-green-400" : "bg-brand-500 dark:bg-brand"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 shrink-0">{progress}%</span>
        </div>
      );
    },
  },
  {
    key: "totalLessons", header: "Lessons",
    render: (e) => (
      <span className="text-[11px] text-gray-400 dark:text-slate-500">{e.completedLessons}/{e.totalLessons}</span>
    ),
  },
  {
    key: "enrolledAt", header: "Enrolled", sortable: true,
    render: (e) => (
      <span className="text-[11px] text-gray-500 dark:text-slate-400">
        {e.enrolledAt ? formatDate(e.enrolledAt) : "—"}
      </span>
    ),
  },
  ];
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm dark:shadow-none">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-3 border-b border-gray-50 dark:border-slate-800 last:border-0">
      <span className="text-xs text-gray-400 dark:text-slate-500 w-28 shrink-0">{label}</span>
      <span className="text-xs text-gray-700 dark:text-slate-200 flex-1">{value || "—"}</span>
    </div>
  );
}

export function StudentDetailClient({ student: initial }: Props) {
  const router = useRouter();
  const [student, setStudent]         = useState(initial);
  const [isPending, startTransition]  = useTransition();
  const [showEdit, setShowEdit]       = useState(false);
  const [showToggle, setShowToggle]   = useState(false);
  const [showDelete, setShowDelete]   = useState(false);
  const { formatDate } = useLocalization();
  const ENROLLMENT_COLUMNS = getEnrollmentColumns(formatDate);

  const completedCount = student.enrollments.filter((e) => e.status === "completed").length;
  const activeCount    = student.enrollments.filter((e) => e.status === "active").length;

  function handleToggleStatus() {
    setShowToggle(false);
    startTransition(async () => {
      const res = await toggleStudentStatusAction(student.id);
      if (res.success && res.data) {
        setStudent((p) => ({ ...p, status: res.data!.status }));
        toast.success("Status updated");
      } else {
        toast.error((res as any).message ?? "Failed to update status");
      }
    });
  }

  function confirmDelete() {
    setShowDelete(false);
    startTransition(async () => {
      const res = await deleteStudentAction(student.id);
      if (res.success) {
        toast.success("Student deleted");
        router.push("/admin/students");
      } else {
        toast.error((res as any).message ?? "Failed to delete");
      }
    });
  }

  return (
    <>
      <div className="space-y-6">
        {/* Back + actions */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <Link href="/admin/students" className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" /> Back to Students
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowEdit(true)}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            <button
              onClick={() => setShowToggle(true)}
              disabled={isPending}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                student.status === "active"
                  ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-500/15 dark:text-yellow-400 dark:hover:bg-yellow-500/25"
                  : "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-500/15 dark:text-green-400 dark:hover:bg-green-500/25"
              }`}
            >
              {student.status === "active"
                ? <><ShieldOff className="h-3.5 w-3.5" /> Suspend</>
                : <><ShieldCheck className="h-3.5 w-3.5" /> Activate</>
              }
            </button>
            <button
              onClick={() => setShowDelete(true)}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>

        {/* Profile header */}
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex items-start gap-5 flex-wrap shadow-sm dark:shadow-none">
          {student.avatar ? (
            <img src={student.avatar} alt={student.firstName} className="h-20 w-20 rounded-2xl object-cover shrink-0" />
          ) : (
            <div className={`h-20 w-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0 ${avatarColors[student.id % avatarColors.length]}`}>
              {student.firstName[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">{student.firstName} {student.lastName}</h1>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg capitalize ${
                student.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
              }`}>
                {student.status}
              </span>
            </div>
            {student.profession && <p className="text-xs text-brand-600 dark:text-brand font-medium mt-1">{student.profession}</p>}
            {student.bio && <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 leading-relaxed max-w-2xl">{student.bio}</p>}
            <div className="flex flex-col gap-1.5 mt-3 sm:flex-row sm:items-center sm:gap-4 sm:flex-wrap">
              {student.email && (
                <a href={`mailto:${student.email}`} className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand transition-colors break-words">
                  <Mail className="h-3 w-3 shrink-0" /> {student.email}
                </a>
              )}
              {student.phone && (
                <span className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-slate-400">
                  <Phone className="h-3 w-3 shrink-0" /> {student.phone}
                </span>
              )}
              {student.socialLinks && Object.entries(student.socialLinks).map(([key, url]) => {
                if (!url) return null;
                const Icon = SOCIAL_ICONS[key.toLowerCase()] ?? Link2;
                return (
                  <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand transition-colors capitalize">
                    <Icon className="h-3 w-3 shrink-0" /> {key}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<BookOpen className="h-5 w-5 text-brand-600 dark:text-brand" />} label="Total Enrollments" value={student.enrollments.length} color="bg-brand-50 dark:bg-brand/15" />
          <StatCard icon={<GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />} label="Active Courses" value={activeCount} color="bg-blue-50 dark:bg-blue-500/15" />
          <StatCard icon={<GraduationCap className="h-5 w-5 text-green-600 dark:text-green-400" />} label="Completed" value={completedCount} color="bg-green-50 dark:bg-green-500/15" />
          <StatCard
            icon={<Mail className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
            label="Joined"
            value={student.createdAt ? formatDate(student.createdAt) : "—"}
            color="bg-amber-50 dark:bg-amber-500/15"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Enrollments */}
          <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm dark:shadow-none">
            <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-800">
              <h2 className="text-xs font-semibold text-gray-900 dark:text-white">Enrolled Courses ({student.enrollments.length})</h2>
            </div>
            <div className="px-5 pt-4 pb-5">
              <DataTable
                data={student.enrollments}
                columns={ENROLLMENT_COLUMNS}
                searchable
                searchPlaceholder="Search course…"
                searchKeys={["courseTitle"]}
                filters={[{
                  key: "status", label: "All Status",
                  options: [
                    { label: "Active",    value: "active"    },
                    { label: "Completed", value: "completed" },
                    { label: "Refunded",  value: "refunded"  },
                  ],
                }]}
                emptyMessage="No enrollments yet."
              />
            </div>
          </div>

          {/* Account info */}
          <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 h-fit shadow-sm dark:shadow-none">
            <h2 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">Account Info</h2>
            <InfoRow label="Full Name"   value={`${student.firstName} ${student.lastName}`} />
            <InfoRow label="Email"       value={student.email ? <a href={`mailto:${student.email}`} className="text-brand-600 dark:text-brand hover:underline break-all">{student.email}</a> : null} />
            <InfoRow label="Phone"       value={student.phone} />
            <InfoRow label="Profession"  value={student.profession} />
            <InfoRow label="Status"      value={
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg capitalize ${student.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"}`}>
                {student.status}
              </span>
            } />
            <InfoRow label="Joined"      value={student.createdAt ? formatDate(student.createdAt) : null} />
          </div>
        </div>
      </div>

      {/* Toggle status modal */}
      <ConfirmModal
        open={showToggle}
        title={student.status === "active" ? "Suspend Student" : "Activate Student"}
        message={
          student.status === "active"
            ? <>Suspend <strong>{student.firstName} {student.lastName}</strong>? They will lose access to the platform.</>
            : <>Activate <strong>{student.firstName} {student.lastName}</strong>? They will regain access to the platform.</>
        }
        confirmLabel={student.status === "active" ? "Yes, Suspend" : "Yes, Activate"}
        variant={student.status === "active" ? "warning" : "success"}
        icon={student.status === "active" ? <ShieldOff className="h-5 w-5 text-yellow-600 dark:text-yellow-400" /> : <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />}
        isPending={isPending}
        onConfirm={handleToggleStatus}
        onClose={() => setShowToggle(false)}
      />

      {/* Delete modal */}
      <ConfirmModal
        open={showDelete}
        title="Delete Student"
        message={<>Delete <strong>{student.firstName} {student.lastName}</strong>? This cannot be undone.</>}
        confirmLabel="Yes, Delete"
        variant="danger"
        icon={<Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />}
        isPending={isPending}
        onConfirm={confirmDelete}
        onClose={() => setShowDelete(false)}
      />

      {/* Edit modal */}
      {showEdit && (
        <EditPersonModal
          entityLabel="Student"
          person={student}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => { setStudent((p) => ({ ...p, ...updated })); }}
          updateAction={updateStudentAction}
          suspendAction={toggleStudentStatusAction}
          activateAction={toggleStudentStatusAction}
          resetPasswordAction={resetStudentPasswordAction}
        />
      )}
    </>
  );
}
