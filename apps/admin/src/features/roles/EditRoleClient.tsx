"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  Eye,
  Gear,
  MagnifyingGlass,
  GraduationCap,
  Broadcast,
  Warning,
} from "@phosphor-icons/react";
import type { CourseOptions, PermissionGroup, Role } from "./types";
import { updateRoleAction, type RoleInput } from "./actions";
import { toast } from "@repo/ui/sonner";

/* ─── Constants ────────────────────────────────────────────────────────────── */

const ASSIGNED_COURSE_PREREQS: Record<string, string[]> = {
  edit_assigned_courses: ["view_courses", "update_courses"],
  edit_assigned_live_courses: ["view_live", "update_live"],
};

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const inputCls =
  "w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-700 dark:text-slate-200 outline-none focus:border-brand-400 dark:focus:border-brand transition-colors placeholder:text-gray-300 dark:placeholder:text-slate-600";

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <span className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </span>
  );
}

function SectionCard({
  title,
  icon,
  color = "blue",
  children,
}: {
  title: string;
  icon: React.ReactNode;
  color?: string;
  children: React.ReactNode;
}) {
  const colorMap: Record<
    string,
    { border: string; bg: string; iconBg: string; iconText: string }
  > = {
    blue: {
      border: "border-blue-100 dark:border-blue-500/20",
      bg: "bg-blue-50/40 dark:bg-blue-500/5",
      iconBg: "bg-blue-100 dark:bg-blue-500/15",
      iconText: "text-blue-600 dark:text-blue-400",
    },
    purple: {
      border: "border-purple-100 dark:border-purple-500/20",
      bg: "bg-purple-50/40 dark:bg-purple-500/5",
      iconBg: "bg-purple-100 dark:bg-purple-500/15",
      iconText: "text-purple-600 dark:text-purple-400",
    },
    emerald: {
      border: "border-emerald-100 dark:border-emerald-500/20",
      bg: "bg-emerald-50/40 dark:bg-emerald-500/5",
      iconBg: "bg-emerald-100 dark:bg-emerald-500/15",
      iconText: "text-emerald-600 dark:text-emerald-400",
    },
    indigo: {
      border: "border-indigo-100 dark:border-indigo-500/20",
      bg: "bg-indigo-50/40 dark:bg-indigo-500/5",
      iconBg: "bg-indigo-100 dark:bg-indigo-500/15",
      iconText: "text-indigo-600 dark:text-indigo-400",
    },
  };
  const c = (colorMap[color] ?? colorMap.blue)!;
  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-5 mb-5`}>
      <div className="flex items-center gap-2 mb-4">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${c.iconBg} ${c.iconText}`}
        >
          {icon}
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────────────────── */

interface Props {
  role: Role;
  permissionGroups: PermissionGroup[];
  courseOptions: CourseOptions;
}

export function EditRoleClient({
  role,
  permissionGroups,
  courseOptions,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(role.name);
  const [slug, setSlug] = useState(role.slug);
  const [description, setDescription] = useState(role.description ?? "");
  const [selected, setSelected] = useState<Set<number>>(
    new Set(role.permissionIds),
  );
  const [assignedCourseIds, setAssignedCourseIds] = useState<Set<number>>(
    new Set(role.assignedCourseIds),
  );
  const [assignedLiveCourseIds, setAssignedLiveCourseIds] = useState<
    Set<number>
  >(new Set(role.assignedLiveCourseIds));
  const [courseSearch, setCourseSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const allPermissionIds = useMemo(
    () => permissionGroups.flatMap((g) => g.permissions.map((p) => p.id)),
    [permissionGroups],
  );

  const slugToId = useMemo(() => {
    const map = new Map<string, number>();
    for (const group of permissionGroups) {
      for (const perm of group.permissions) map.set(perm.slug, perm.id);
    }
    return map;
  }, [permissionGroups]);

  /* ─── Completion Progress ─────────────────────────────────────────────────── */
  const completionPct = useMemo(() => {
    let filled = 0;
    let total = 0;
    total += 2;
    if (name.trim()) filled += 2;
    total += 2;
    if (slug.trim()) filled += 2;
    total += 1;
    if (selected.size > 0) filled += 1;
    total += 1;
    if (description.trim()) filled += 1;
    return Math.round((filled / total) * 100);
  }, [name, slug, selected, description]);

  /* ─── Handlers ────────────────────────────────────────────────────────────── */

  function handleName(value: string) {
    setName(value);
    if (!slugManuallyEdited) {
      setSlug(slugify(value));
    }
    setErrors((p) => {
      const n = { ...p };
      delete n.name;
      delete n.slug;
      return n;
    });
  }

  function handleSlug(value: string) {
    setSlug(value);
    setSlugManuallyEdited(true);
    setErrors((p) => {
      const n = { ...p };
      delete n.slug;
      return n;
    });
  }

  function togglePermission(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      const turningOn = !next.has(id);
      if (turningOn) {
        next.add(id);
        const slug = [...slugToId.entries()].find(([, pid]) => pid === id)?.[0];
        const prereqs = slug ? ASSIGNED_COURSE_PREREQS[slug] : undefined;
        for (const p of prereqs ?? []) {
          const pid = slugToId.get(p);
          if (pid !== undefined) next.add(pid);
        }
      } else {
        next.delete(id);
      }
      return next;
    });
    setErrors((p) => {
      const n = { ...p };
      delete n.permissions;
      return n;
    });
  }

  function toggleGroup(
    group: { permissions: { id: number }[] },
    checked: boolean,
  ) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of group.permissions) {
        if (checked) next.add(p.id);
        else next.delete(p.id);
      }
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(allPermissionIds) : new Set());
  }

  function toggleCourse(kind: "course" | "live", id: number) {
    const setFn =
      kind === "course" ? setAssignedCourseIds : setAssignedLiveCourseIds;
    setFn((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Role name is required";
    if (!slug.trim()) e.slug = "Slug is required";
    if (selected.size === 0) e.permissions = "Select at least one permission";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) {
      toast.error("Please fix the errors");
      return;
    }
    startTransition(async () => {
      const input: RoleInput = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        permissions: [...selected],
        assignedCourseIds: [...assignedCourseIds],
        assignedLiveCourseIds: [...assignedLiveCourseIds],
      };
      const res = await updateRoleAction(role.id, input);
      if (res.success) {
        toast.success("Role updated");
        router.push("/admin/roles");
      } else {
        toast.error(res.message ?? "Failed to update role");
      }
    });
  }

  /* ─── Course picker (conditional) ─────────────────────────────────────────── */
  const editCoursesId = slugToId.get("edit_assigned_courses");
  const editLiveId = slugToId.get("edit_assigned_live_courses");
  const showCoursePicker =
    (editCoursesId !== undefined && selected.has(editCoursesId)) ||
    (editLiveId !== undefined && selected.has(editLiveId));

  const search = courseSearch.trim().toLowerCase();
  const recorded = courseOptions.courses
    .filter((c) => !search || c.title.toLowerCase().includes(search))
    .map((c) => ({ ...c, kind: "course" as const }));
  const live = courseOptions.liveCourses
    .filter((c) => !search || c.title.toLowerCase().includes(search))
    .map((c) => ({ ...c, kind: "live" as const }));
  const combined = [...recorded, ...live];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Edit Role
              </h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Update role details and permissions
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
            {completionPct}% complete
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${completionPct}%`,
              background:
                completionPct === 100
                  ? "linear-gradient(90deg, #22c55e, #10b981)"
                  : completionPct > 60
                    ? "linear-gradient(90deg, #6366f1, #8b5cf6)"
                    : "linear-gradient(90deg, #f97316, #f59e0b)",
            }}
          />
        </div>
      </div>

      {/* Section 1: Basic Info */}
      <SectionCard
        title="Basic Info"
        icon={<ShieldCheck className="h-4 w-4" />}
        color="blue"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel label="Role Name" required />
            <input
              className={inputCls}
              value={name}
              placeholder="e.g. Content Editor"
              onChange={(e) => handleName(e.target.value)}
            />
            {errors.name && (
              <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                <Warning className="h-3 w-3" />
                {errors.name}
              </p>
            )}
          </div>
          <div>
            <FieldLabel label="Slug" required />
            <input
              className={inputCls}
              value={slug}
              placeholder="content-editor"
              onChange={(e) => handleSlug(e.target.value)}
            />
            {errors.slug && (
              <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                <Warning className="h-3 w-3" />
                {errors.slug}
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <FieldLabel label="Description" />
            <textarea
              className={inputCls + " resize-none"}
              rows={2}
              value={description}
              placeholder="What can this role do?"
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </SectionCard>

      {/* Section 2: Permissions */}
      <SectionCard
        title="Permissions"
        icon={<Gear className="h-4 w-4" />}
        color="purple"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {selected.size} of {allPermissionIds.length} selected
          </p>
          <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-gray-300 dark:border-slate-700 text-brand-600 dark:text-brand focus:ring-brand-300 dark:focus:ring-brand/40"
              checked={
                selected.size === allPermissionIds.length &&
                allPermissionIds.length > 0
              }
              onChange={(e) => toggleAll(e.target.checked)}
            />
            Select all
          </label>
        </div>

        {errors.permissions && (
          <p className="text-[10px] text-red-500 mb-2 flex items-center gap-1">
            <Warning className="h-3 w-3" />
            {errors.permissions}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {permissionGroups.map((group) => {
            const allChecked = group.permissions.every((p) =>
              selected.has(p.id),
            );
            return (
              <div
                key={group.group}
                className="border border-gray-200 dark:border-slate-700 rounded-xl p-3 space-y-2 bg-white dark:bg-slate-900/50"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-700">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 dark:border-slate-700 text-brand-600 dark:text-brand focus:ring-brand-300 dark:focus:ring-brand/40"
                    checked={allChecked}
                    onChange={(e) => toggleGroup(group, e.target.checked)}
                  />
                  <span className="font-medium text-sm text-gray-800 dark:text-slate-200">
                    {group.label}
                  </span>
                  <span className="ml-auto text-[11px] text-gray-400 dark:text-slate-500">
                    {
                      group.permissions.filter((p) => selected.has(p.id))
                        .length
                    }
                    /{group.permissions.length}
                  </span>
                </div>
                <div className="space-y-1.5 pl-1">
                  {group.permissions.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 dark:border-slate-700 text-brand-600 dark:text-brand focus:ring-brand-300 dark:focus:ring-brand/40"
                        checked={selected.has(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                      />
                      {perm.type === "page" ? (
                        <Eye
                          size={14}
                          className="text-blue-500 dark:text-blue-400 shrink-0"
                        />
                      ) : (
                        <Gear
                          size={14}
                          className="text-gray-400 dark:text-slate-500 shrink-0"
                        />
                      )}
                      <span className="text-gray-700 dark:text-slate-300">
                        {perm.name}
                      </span>
                      <span
                        className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${
                          perm.type === "page"
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
                            : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                        }`}
                      >
                        {perm.type === "page" ? "Page" : "API"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Section 3: Course Assignment (conditional) */}
      {showCoursePicker && (
        <SectionCard
          title="Assigned Courses"
          icon={<GraduationCap className="h-4 w-4" />}
          color="emerald"
        >
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
            This role can only edit the specific courses selected here — not
            every course.
          </p>
          <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900/50">
              <MagnifyingGlass
                size={14}
                className="text-gray-400 dark:text-slate-500 shrink-0"
              />
              <input
                type="text"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="Search courses…"
                className="w-full bg-transparent text-sm outline-none text-gray-800 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-700">
              {combined.length === 0 && (
                <p className="px-3 py-4 text-sm text-gray-400 dark:text-slate-500 text-center">
                  No courses found
                </p>
              )}
              {combined.map((c) => {
                const checked =
                  c.kind === "course"
                    ? assignedCourseIds.has(c.id)
                    : assignedLiveCourseIds.has(c.id);
                return (
                  <label
                    key={`${c.kind}-${c.id}`}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 dark:border-slate-700 text-brand-600 dark:text-brand focus:ring-brand-300 dark:focus:ring-brand/40"
                      checked={checked}
                      onChange={() => toggleCourse(c.kind, c.id)}
                    />
                    {c.kind === "course" ? (
                      <GraduationCap
                        size={14}
                        className="text-brand-500 dark:text-brand shrink-0"
                      />
                    ) : (
                      <Broadcast
                        size={14}
                        className="text-orange-500 dark:text-orange-400 shrink-0"
                      />
                    )}
                    <span className="text-gray-700 dark:text-slate-300 truncate flex-1">
                      {c.title}
                    </span>
                    <span
                      className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
                        c.kind === "course"
                          ? "bg-brand-50 text-brand-600 dark:bg-brand/15 dark:text-brand"
                          : "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400"
                      }`}
                    >
                      {c.kind === "course" ? "Recorded" : "Live"}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-2">
            {assignedCourseIds.size + assignedLiveCourseIds.size} courses
            assigned
          </p>
        </SectionCard>
      )}

      {/* Submit */}
      <div className="flex gap-3 sticky bottom-0 bg-gray-50 dark:bg-slate-950 py-4 -mx-6 px-6 border-t border-gray-100 dark:border-slate-800">
        <button
          onClick={() => router.back()}
          className="flex-1 rounded-xl border border-gray-200 dark:border-slate-700 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="flex-1 rounded-xl bg-brand-600 dark:bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-700 dark:hover:bg-brand-hover disabled:opacity-60 transition-colors"
        >
          {isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
