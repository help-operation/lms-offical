"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ChevronLeft, BookOpen, GraduationCap, Star, Mail,
  Globe, ShieldOff, ShieldCheck, Pencil, Trash2, Link2,
} from "lucide-react";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { EditPersonModal } from "@/shared/components/EditPersonModal";
import { toast } from "@repo/ui/sonner";
import {
  toggleTeacherStatusAction,
  updateTeacherAction,
  resetTeacherPasswordAction,
  deleteTeacherAction,
} from "@/features/teachers/actions/teachers.actions";
import type { TeacherDetail, TeacherCourse } from "./types";
import { useLocalization } from "@/shared/context/LocalizationContext";

interface Props { teacher: TeacherDetail }

const avatarColors = ["bg-violet-400", "bg-blue-400", "bg-emerald-400", "bg-amber-400"];

const COURSE_STATUS_STYLES: Record<string, string> = {
  published: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  draft:     "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
  archived:  "bg-gray-100 text-gray-500 dark:bg-slate-500/15 dark:text-slate-400",
};

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  linkedin:  Link2,
  youtube:   Link2,
  twitter:   Link2,
  facebook:  Link2,
  instagram: Link2,
  website:   Globe,
};

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

export function TeacherDetailClient({ teacher: initial }: Props) {
  const { formatDate } = useLocalization();
  const router = useRouter();
  const [teacher, setTeacher]         = useState(initial);
  const [isPending, startTransition]  = useTransition();
  const [showEdit, setShowEdit]       = useState(false);
  const [showDelete, setShowDelete]   = useState(false);
  const [showToggle, setShowToggle]   = useState(false);

  const displayName   = teacher.displayName  || `${teacher.firstName} ${teacher.lastName}`;
  const displayAvatar = teacher.displayAvatar || teacher.avatar;

  function handleToggleStatus() {
    setShowToggle(false);
    startTransition(async () => {
      const res = await toggleTeacherStatusAction(teacher.id);
      if (res.success && res.data) {
        setTeacher((p) => ({ ...p, status: res.data!.status }));
        toast.success("Status updated");
      } else {
        toast.error((res as any).message ?? "Failed");
      }
    });
  }

  function confirmDelete() {
    setShowDelete(false);
    startTransition(async () => {
      const res = await deleteTeacherAction(teacher.id);
      if (res.success) {
        toast.success("Teacher deleted");
        router.push("/admin/teachers");
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
          <Link
            href="/admin/teachers"
            className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back to Teachers
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
                teacher.status === "active"
                  ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-500/15 dark:text-yellow-400 dark:hover:bg-yellow-500/25"
                  : "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-500/15 dark:text-green-400 dark:hover:bg-green-500/25"
              }`}
            >
              {teacher.status === "active"
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
          {displayAvatar ? (
            <img src={displayAvatar} alt={displayName} className="h-20 w-20 rounded-2xl object-cover shrink-0" />
          ) : (
            <div className={`h-20 w-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0 ${avatarColors[teacher.id % avatarColors.length]}`}>
              {teacher.firstName[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">{displayName}</h1>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg capitalize ${
                teacher.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
              }`}>
                {teacher.status}
              </span>
            </div>
            {teacher.expertise && (
              <p className="text-xs text-brand-600 dark:text-brand font-medium mt-1">{teacher.expertise}</p>
            )}
            {teacher.bio && (
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 leading-relaxed max-w-2xl">{teacher.bio}</p>
            )}
            {/* Social links */}
            {teacher.socialLinks && Object.keys(teacher.socialLinks).length > 0 && (
              <div className="flex flex-col gap-1.5 mt-3 sm:flex-row sm:items-center sm:gap-4 sm:flex-wrap">
                {Object.entries(teacher.socialLinks).map(([key, url]) => {
                  if (!url) return null;
                  const Icon = SOCIAL_ICONS[key.toLowerCase()] ?? Globe;
                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand transition-colors capitalize"
                    >
                      <Icon className="h-3 w-3 shrink-0" /> {key}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<BookOpen className="h-5 w-5 text-brand-600 dark:text-brand" />}
            label="Total Courses"
            value={teacher.courses.length}
            color="bg-brand-50 dark:bg-brand/15"
          />
          <StatCard
            icon={<GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
            label="Total Students"
            value={(teacher.totalStudents ?? 0).toLocaleString()}
            color="bg-blue-50 dark:bg-blue-500/15"
          />
          <StatCard
            icon={<Star className="h-5 w-5 text-amber-500 dark:text-amber-400" />}
            label="Average Rating"
            value={teacher.rating ? parseFloat(teacher.rating).toFixed(1) : "—"}
            color="bg-amber-50 dark:bg-amber-500/15"
          />
          <StatCard
            icon={<Mail className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
            label="Joined"
            value={teacher.createdAt ? formatDate(teacher.createdAt) : "—"}
            color="bg-emerald-50 dark:bg-emerald-500/15"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Courses */}
          <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm dark:shadow-none">
            <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-800">
              <h2 className="text-xs font-semibold text-gray-900 dark:text-white">Courses ({teacher.courses.length})</h2>
            </div>
            {teacher.courses.length === 0 ? (
              <p className="px-5 py-10 text-center text-xs text-gray-400 dark:text-slate-500">No courses yet.</p>
            ) : (
              <ul className="divide-y divide-gray-50 dark:divide-slate-800">
                {teacher.courses.map((course) => (
                  <li key={course.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="h-12 w-16 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="h-12 w-16 rounded-lg bg-gray-100 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-gray-300 dark:text-slate-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{course.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${COURSE_STATUS_STYLES[course.status] ?? "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                          {course.status}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" /> {course.totalStudents}
                        </span>
                        {course.rating && (
                          <span className="text-[10px] text-gray-400 dark:text-slate-500 flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-400 fill-amber-400" /> {parseFloat(course.rating).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 shrink-0">
                      {parseFloat(course.price) === 0 ? "Free" : `৳${parseFloat(course.price).toLocaleString()}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Account info + payout */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm dark:shadow-none">
              <h2 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">Account Info</h2>
              <InfoRow label="Full Name"     value={`${teacher.firstName} ${teacher.lastName}`} />
              <InfoRow label="Display Name"  value={teacher.displayName} />
              <InfoRow label="Email"         value={<a href={`mailto:${teacher.email}`} className="text-brand-600 dark:text-brand hover:underline break-all">{teacher.email}</a>} />
              <InfoRow label="Expertise"     value={teacher.expertise} />
              <InfoRow label="Status"        value={
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg capitalize ${teacher.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"}`}>
                  {teacher.status}
                </span>
              } />
              <InfoRow label="Joined"        value={teacher.createdAt ? formatDate(teacher.createdAt) : null} />
            </div>

            {teacher.payoutInfo && Object.keys(teacher.payoutInfo).length > 0 && (
              <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm dark:shadow-none">
                <h2 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">Payout Info</h2>
                {Object.entries(teacher.payoutInfo).map(([key, val]) => (
                  val ? <InfoRow key={key} label={key} value={val} /> : null
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toggle status modal */}
      <ConfirmModal
        open={showToggle}
        title={teacher.status === "active" ? "Suspend Teacher" : "Activate Teacher"}
        message={
          teacher.status === "active"
            ? <>Suspend <strong>{displayName}</strong>? They will lose access to the platform.</>
            : <>Activate <strong>{displayName}</strong>? They will regain access to the platform.</>
        }
        confirmLabel={teacher.status === "active" ? "Yes, Suspend" : "Yes, Activate"}
        variant={teacher.status === "active" ? "warning" : "success"}
        icon={teacher.status === "active" ? <ShieldOff className="h-5 w-5 text-yellow-600 dark:text-yellow-400" /> : <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />}
        isPending={isPending}
        onConfirm={handleToggleStatus}
        onClose={() => setShowToggle(false)}
      />

      {/* Edit modal */}
      {showEdit && (
        <EditPersonModal
          entityLabel="Teacher"
          person={teacher}
          showPhone={false}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => { setTeacher((p) => ({ ...p, ...updated })); }}
          updateAction={updateTeacherAction}
          suspendAction={toggleTeacherStatusAction}
          activateAction={toggleTeacherStatusAction}
          resetPasswordAction={resetTeacherPasswordAction}
        />
      )}

      {/* Delete modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl dark:shadow-none">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Delete Teacher</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Delete <strong>{displayName}</strong>? All their data will be permanently removed.
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowDelete(false)} className="rounded-xl px-4 py-2 text-xs font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isPending}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
