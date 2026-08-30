"use client";

import { useMemo, useState, useTransition, type Dispatch, type SetStateAction } from "react";
import {
  ShieldCheck,
  Lock,
  Plus,
  PencilSimple,
  Trash,
  X,
  Eye,
  Gear,
  Users,
  CheckCircle,
  MagnifyingGlass,
  GraduationCap,
  Broadcast,
} from "@phosphor-icons/react";
import type { CourseOptions, Permission, PermissionGroup, Role } from "./types";
import {
  createRoleAction,
  updateRoleAction,
  deleteRoleAction,
  type RoleInput,
} from "./actions";
import { toast } from "@repo/ui/sonner";
import { ConfirmModal } from "@/shared/components/ConfirmModal";

const SUPER_ADMIN_SLUG = "super-admin";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Role editor modal ──────────────────────────────────────────────────────

/** Permission slugs that gate course-scoped editing, and the slugs each one
 *  requires to even reach the guarded routes (see PermissionsGuard — it's an
 *  AND-only check, so the prerequisite must be granted too). */
const ASSIGNED_COURSE_PREREQS: Record<string, string[]> = {
  edit_assigned_courses: ["view_courses", "update_courses"],
  edit_assigned_live_courses: ["view_live", "update_live"],
};

function RoleModal({
  role,
  groups,
  allPermissionIds,
  courseOptions,
  onClose,
  onSaved,
}: {
  role: Role | null;
  groups: PermissionGroup[];
  allPermissionIds: number[];
  courseOptions: CourseOptions;
  onClose: () => void;
  onSaved: (role: Role) => void;
}) {
  const editing = !!role;
  const [name, setName] = useState(role?.name ?? "");
  const [slug, setSlug] = useState(role?.slug ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [selected, setSelected] = useState<Set<number>>(
    new Set(role?.permissionIds ?? []),
  );
  const [assignedCourseIds, setAssignedCourseIds] = useState<Set<number>>(
    new Set(role?.assignedCourseIds ?? []),
  );
  const [assignedLiveCourseIds, setAssignedLiveCourseIds] = useState<Set<number>>(
    new Set(role?.assignedLiveCourseIds ?? []),
  );
  const [courseSearch, setCourseSearch] = useState("");
  const [error, setError] = useState("");
  const [isPending, start] = useTransition();

  const isSystem = role?.isSystem ?? false;

  const slugToId = useMemo(() => {
    const map = new Map<string, number>();
    for (const group of groups) {
      for (const perm of group.permissions) map.set(perm.slug, perm.id);
    }
    return map;
  }, [groups]);

  function handleName(value: string) {
    setName(value);
    if (!editing) setSlug(slugify(value));
  }

  function togglePermission(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      const turningOn = !next.has(id);
      if (turningOn) {
        next.add(id);
        // The course-scoped permissions restrict a route's per-record access,
        // but the route itself still requires the base view/update slug — add
        // those automatically so the role doesn't end up 403'd on save.
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
  }

  function toggleGroup(group: PermissionGroup, checked: boolean) {
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

  function submit() {
    if (!name.trim() || !slug.trim()) {
      setError("Name and slug are required");
      return;
    }
    if (selected.size === 0) {
      setError("Select at least one permission");
      return;
    }
    const input: RoleInput = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      permissions: [...selected],
      assignedCourseIds: [...assignedCourseIds],
      assignedLiveCourseIds: [...assignedLiveCourseIds],
    };
    start(async () => {
      const res = role
        ? await updateRoleAction(role.id, input)
        : await createRoleAction(input);
      if (res.success) {
        onSaved(res.data);
        onClose();
        toast.success(role ? "Role updated" : "Role created");
      } else {
        setError(res.message);
      }
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck size={18} weight="fill" className="text-brand-600 dark:text-brand" />
            {editing ? "Edit Role" : "Create Role"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-slate-300">
                Role name
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 dark:focus:ring-brand/40"
                value={name}
                placeholder="e.g. Content Editor"
                onChange={(e) => handleName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-slate-300">Slug</label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 dark:focus:ring-brand/40 disabled:bg-gray-50 dark:disabled:bg-slate-800 disabled:text-gray-400 dark:disabled:text-slate-500"
                value={slug}
                disabled={isSystem}
                placeholder="content-editor"
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-slate-300">
              Description
            </label>
            <textarea
              className="mt-1 w-full rounded-xl border border-gray-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 dark:focus:ring-brand/40"
              rows={2}
              value={description}
              placeholder="What can this role do?"
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Permissions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                Permissions
              </label>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groups.map((group) => {
                const allChecked = group.permissions.every((p) =>
                  selected.has(p.id),
                );
                return (
                  <div
                    key={group.group}
                    className="border border-gray-200 dark:border-slate-800 rounded-xl p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-800">
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
                      {group.permissions.map((perm: Permission) => (
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
                            <Eye size={14} className="text-blue-500 dark:text-blue-400 shrink-0" />
                          ) : (
                            <Gear
                              size={14}
                              className="text-gray-400 dark:text-slate-500 shrink-0"
                            />
                          )}
                          <span className="text-gray-700 dark:text-slate-300">{perm.name}</span>
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
          </div>

          {/* Assigned courses — only shown once one of the course-scoped edit
              permissions is selected above. */}
          {(() => {
            const editCoursesId = slugToId.get("edit_assigned_courses");
            const editLiveId = slugToId.get("edit_assigned_live_courses");
            const showPicker =
              (editCoursesId !== undefined && selected.has(editCoursesId)) ||
              (editLiveId !== undefined && selected.has(editLiveId));
            if (!showPicker) return null;

            const search = courseSearch.trim().toLowerCase();
            const recorded = courseOptions.courses
              .filter((c) => !search || c.title.toLowerCase().includes(search))
              .map((c) => ({ ...c, kind: "course" as const }));
            const live = courseOptions.liveCourses
              .filter((c) => !search || c.title.toLowerCase().includes(search))
              .map((c) => ({ ...c, kind: "live" as const }));
            const combined = [...recorded, ...live];
            const totalAssigned = assignedCourseIds.size + assignedLiveCourseIds.size;

            function toggleCourse(kind: "course" | "live", id: number) {
              const setFn = kind === "course" ? setAssignedCourseIds : setAssignedLiveCourseIds;
              setFn((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              });
            }

            return (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                    Assigned Courses
                  </label>
                  <span className="text-[11px] text-gray-400 dark:text-slate-500">
                    {totalAssigned} selected
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">
                  This role can only edit the specific courses selected here — not every course.
                </p>
                <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-slate-800">
                    <MagnifyingGlass size={14} className="text-gray-400 dark:text-slate-500 shrink-0" />
                    <input
                      type="text"
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      placeholder="Search courses…"
                      className="w-full bg-transparent text-sm outline-none text-gray-800 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-800">
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
                          className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800"
                        >
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 dark:border-slate-700 text-brand-600 dark:text-brand focus:ring-brand-300 dark:focus:ring-brand/40"
                            checked={checked}
                            onChange={() => toggleCourse(c.kind, c.id)}
                          />
                          {c.kind === "course" ? (
                            <GraduationCap size={14} className="text-brand-500 dark:text-brand shrink-0" />
                          ) : (
                            <Broadcast size={14} className="text-orange-500 dark:text-orange-400 shrink-0" />
                          )}
                          <span className="text-gray-700 dark:text-slate-300 truncate flex-1">{c.title}</span>
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
              </div>
            );
          })()}

          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 dark:border-slate-800 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={isPending}
            className="flex-1 rounded-xl bg-brand-600 dark:bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-700 dark:hover:bg-brand-hover disabled:opacity-60"
          >
            {isPending ? "Saving…" : editing ? "Update Role" : "Create Role"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

interface Props {
  roles: Role[];
  setRoles: Dispatch<SetStateAction<Role[]>>;
  permissionGroups: PermissionGroup[];
  courseOptions: CourseOptions;
  canManage: boolean;
}

export function RoleManagementClient({
  roles,
  setRoles,
  permissionGroups,
  courseOptions,
  canManage,
}: Props) {
  const [editing, setEditing] = useState<Role | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [isPending, start] = useTransition();

  const allPermissionIds = useMemo(
    () => permissionGroups.flatMap((g) => g.permissions.map((p) => p.id)),
    [permissionGroups],
  );

  function handleSaved(saved: Role) {
    setRoles((prev) => {
      const exists = prev.some((r) => r.id === saved.id);
      return exists
        ? prev.map((r) => (r.id === saved.id ? saved : r))
        : [...prev, saved];
    });
  }

  function handleDelete(role: Role) {
    setDeleteTarget(null);
    start(async () => {
      const res = await deleteRoleAction(role.id);
      if (res.success) {
        setRoles((prev) => prev.filter((r) => r.id !== role.id));
        toast.success("Role deleted");
      } else {
        toast.error(res.message ?? "Failed to delete role");
      }
    });
  }

  const systemCount = roles.filter((r) => r.isSystem).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Roles &amp; Permissions
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Define what each role can access across the admin panel
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 dark:bg-brand hover:bg-brand-700 dark:hover:bg-brand-hover text-white text-sm font-medium transition-colors"
          >
            <Plus size={16} weight="bold" />
            New Role
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          {
            label: "Total Roles",
            value: roles.length,
            icon: ShieldCheck,
            color: "bg-violet-500",
          },
          {
            label: "Permissions",
            value: allPermissionIds.length,
            icon: CheckCircle,
            color: "bg-emerald-500",
          },
          {
            label: "System Roles",
            value: systemCount,
            icon: Lock,
            color: "bg-indigo-500",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 px-4 py-3"
          >
            <div
              className={`h-9 w-9 rounded-xl ${s.color} flex items-center justify-center shrink-0`}
            >
              <s.icon size={16} weight="fill" className="text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Role list */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
        {roles.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400 dark:text-slate-500">
            No roles found
          </div>
        ) : (
          roles.map((role) => {
            const locked = role.slug === SUPER_ADMIN_SLUG;
            return (
              <div
                key={role.id}
                className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 dark:border-slate-800 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand/15 text-brand-700 dark:text-brand flex items-center justify-center shrink-0">
                  {role.isSystem ? (
                    <Lock size={18} weight="fill" />
                  ) : (
                    <ShieldCheck size={18} weight="fill" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {role.name}
                    </p>
                    {role.isSystem && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400">
                        System
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 truncate">
                    {role.description || role.slug}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                  <Users size={13} />
                  {role.usersCount} {role.usersCount === 1 ? "admin" : "admins"}
                </div>
                <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                  <ShieldCheck size={13} />
                  {role.permissionIds.length} perms
                </div>
                {canManage && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setEditing(role)}
                      disabled={locked}
                      title={
                        locked ? "Super Admin cannot be edited" : "Edit role"
                      }
                      className="h-7 w-7 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand/15 hover:text-brand-600 dark:hover:text-brand flex items-center justify-center text-gray-500 dark:text-slate-400 transition-colors disabled:opacity-40 disabled:hover:bg-gray-100 dark:disabled:hover:bg-slate-800"
                    >
                      <PencilSimple size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(role)}
                      disabled={role.isSystem || isPending}
                      title={
                        role.isSystem
                          ? "System roles can't be deleted"
                          : "Delete role"
                      }
                      className="h-7 w-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25 flex items-center justify-center transition-colors disabled:opacity-40 disabled:hover:bg-red-50 dark:disabled:hover:bg-red-500/15"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Role"
        message={deleteTarget ? <>Delete role <strong>"{deleteTarget.name}"</strong>? This cannot be undone.</> : ""}
        confirmLabel="Yes, Delete"
        variant="danger"
        isPending={isPending}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />

      {(showCreate || editing) && (
        <RoleModal
          role={editing}
          groups={permissionGroups}
          allPermissionIds={allPermissionIds}
          courseOptions={courseOptions}
          onClose={() => {
            setShowCreate(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
