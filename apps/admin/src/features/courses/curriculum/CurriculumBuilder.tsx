"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  Plus, Trash2, ChevronDown, ChevronRight, GripVertical,
  Video, Eye, EyeOff, Link, FileText, HelpCircle, ClipboardList,
  Pencil, Check, X, Play,
} from "lucide-react";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import type { CourseModule, Lesson, LessonType } from "@/features/courses/api";
import { LessonVideoSource } from "./LessonVideoSource";
import { useLessonVideoUploads } from "./useLessonVideoUploads";
import { useBunnyStatusPolling } from "./useBunnyStatusPolling";
import { LessonUploadProgress } from "./LessonUploadProgress";
import { LessonEditModal } from "./LessonEditModal";
import { QuizBuilderModal } from "./QuizBuilderModal";
import { AssignmentBuilderModal } from "./AssignmentBuilderModal";
import { AddLessonRow, VideoStatusBadge } from "./CurriculumBuilderParts";
import { LessonPreviewModal } from "./LessonPreviewModal";
import { recordedCurriculumAdapter, type CurriculumAdapter } from "./curriculum-adapter";
import { createAssessmentsBrowserApi } from "@/features/courses/api/assessments/browser";
import { toast } from "@repo/ui/sonner";

interface CurriculumBuilderProps {
  courseId: number;
  initialModules: CourseModule[];
  /** Course-type adapter (actions + feature flags). Defaults to recorded. */
  adapter?: CurriculumAdapter;
  /** Called whenever modules state changes (for live preview sync). */
  onModulesChange?: (modules: CourseModule[]) => void;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return "";
}

const LESSON_TYPE_ICONS: Record<LessonType, React.ComponentType<{ className?: string }>> = {
  video: Video,
  text: FileText,
  quiz: HelpCircle,
  assignment: ClipboardList,
};

export function CurriculumBuilder({
  courseId,
  initialModules,
  adapter = recordedCurriculumAdapter,
  onModulesChange,
}: CurriculumBuilderProps) {
  const { features } = adapter;
  const assessmentsApi = useMemo(
    () => createAssessmentsBrowserApi(adapter.assessmentBasePath),
    [adapter],
  );
  const [modules, setModules] = useState<CourseModule[]>(initialModules);

  useEffect(() => {
    onModulesChange?.(modules);
  }, [modules, onModulesChange]);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(
    new Set(initialModules.map((m) => m.id))
  );
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [addingModule, setAddingModule] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState("");
  const [videoSourceLessonId, setVideoSourceLessonId] = useState<number | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [previewLessonId, setPreviewLessonId] = useState<number | null>(null);
  const [builderLesson, setBuilderLesson] = useState<
    { id: number; title: string; kind: "quiz" | "assignment" } | null
  >(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [deleteModuleTarget, setDeleteModuleTarget] = useState<CourseModule | null>(null);
  const [deleteLessonTarget, setDeleteLessonTarget] = useState<{ moduleId: number; lesson: Lesson } | null>(null);

  // Per-lesson Bunny uploads (run inline on the row; multiple at once allowed).
  const { uploads, start: startUpload, cancel: cancelUpload } =
    useLessonVideoUploads(adapter.getBunnyCredentials);

  // Poll Bunny for lessons still transcoding so they flip to Ready without a reload.
  const pendingVideoLessonIds = modules
    .flatMap((m) => m.lessons)
    .filter(
      (l) =>
        l.videoSource === "bunny" &&
        l.bunnyStatus === "processing" &&
        !uploads[l.id],
    )
    .map((l) => l.id);

  const fetchLessonStatus = useCallback(
    (lessonId: number) => adapter.fetchLessonStatus(lessonId),
    [adapter],
  );

  useBunnyStatusPolling(pendingVideoLessonIds, fetchLessonStatus, (lessonId, result) => {
    setModules((prev) =>
      prev.map((m) => ({
        ...m,
        lessons: m.lessons.map((l) =>
          l.id === lessonId
            ? { ...l, bunnyStatus: result.status, duration: result.duration ?? l.duration }
            : l,
        ),
      })),
    );
  });

  // Drag state
  const [draggedModuleId, setDraggedModuleId] = useState<number | null>(null);
  const [draggedLesson, setDraggedLesson] = useState<{ moduleId: number; lessonId: number } | null>(null);

  function toggleModule(id: number) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAddModule() {
    if (!newModuleTitle.trim()) return;
    startTransition(async () => {
      const res = await adapter.createModule(courseId, newModuleTitle.trim());
      if (!res.success) { setError(res.message ?? "Failed"); return; }
      setModules((prev) => [...prev, { ...res.data!, lessons: [] }]);
      setExpandedModules((prev) => new Set([...prev, res.data!.id]));
      setNewModuleTitle("");
      setAddingModule(false);
      toast.success("Module added");
    });
  }

  function handleRenameModule(moduleId: number) {
    const title = editModuleTitle.trim();
    if (!title) return;
    startTransition(async () => {
      const res = await adapter.renameModule(courseId, moduleId, title);
      if (!res.success) { setError(res.message ?? "Failed"); return; }
      setModules((prev) => prev.map((m) => (m.id === moduleId ? { ...m, title } : m)));
      setEditingModuleId(null);
      toast.success("Module renamed");
    });
  }

  function handleDeleteModule(mod: CourseModule) {
    setDeleteModuleTarget(null);
    startTransition(async () => {
      const res = await adapter.deleteModule(courseId, mod.id);
      if (!res.success) { setError(res.message ?? "Failed"); return; }
      setModules((prev) => prev.filter((m) => m.id !== mod.id));
      toast.success("Module deleted");
    });
  }

  function persistModuleOrder(next: CourseModule[]) {
    setModules(next);
    startTransition(async () => {
      const res = await adapter.reorderModules(
        courseId,
        next.map((m, i) => ({ id: m.id, order: i }))
      );
      if (!res.success) setError(res.message ?? "Failed to reorder modules");
    });
  }

  function persistLessonOrder(moduleId: number, lessons: Lesson[]) {
    setModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, lessons } : m))
    );
    startTransition(async () => {
      const res = await adapter.reorderLessons(
        courseId,
        moduleId,
        lessons.map((l, i) => ({ id: l.id, order: i }))
      );
      if (!res.success) setError(res.message ?? "Failed to reorder lessons");
    });
  }

  // ── Module drag handlers ─────────────────────────────────────────────────────
  function onModuleDrop(targetId: number) {
    if (draggedModuleId === null || draggedModuleId === targetId) return;
    const from = modules.findIndex((m) => m.id === draggedModuleId);
    const to = modules.findIndex((m) => m.id === targetId);
    if (from === -1 || to === -1) return;
    const next = [...modules];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    setDraggedModuleId(null);
    persistModuleOrder(next);
  }

  // ── Lesson drag handlers ─────────────────────────────────────────────────────
  function onLessonDrop(moduleId: number, targetLessonId: number) {
    if (!draggedLesson || draggedLesson.moduleId !== moduleId) return;
    if (draggedLesson.lessonId === targetLessonId) return;
    const mod = modules.find((m) => m.id === moduleId);
    if (!mod) return;
    const from = mod.lessons.findIndex((l) => l.id === draggedLesson.lessonId);
    const to = mod.lessons.findIndex((l) => l.id === targetLessonId);
    if (from === -1 || to === -1) return;
    const lessons = [...mod.lessons];
    const [moved] = lessons.splice(from, 1);
    lessons.splice(to, 0, moved!);
    setDraggedLesson(null);
    persistLessonOrder(moduleId, lessons);
  }

  function handleAddLesson(
    moduleId: number,
    data: { title: string; type: LessonType; isFree: boolean }
  ) {
    startTransition(async () => {
      const res = await adapter.createLesson(courseId, moduleId, data);
      if (!res.success) { setError(res.message ?? "Failed"); return; }
      setModules((prev) =>
        prev.map((m) =>
          m.id === moduleId ? { ...m, lessons: [...m.lessons, res.data!] } : m
        )
      );
      toast.success("Lesson added");
    });
  }

  function handleSaveLesson(
    moduleId: number,
    lessonId: number,
    data: { title: string; type: LessonType; content: string; isFree: boolean; duration: number }
  ) {
    startTransition(async () => {
      const res = await adapter.updateLesson(courseId, moduleId, lessonId, data);
      if (!res.success) { setError(res.message ?? "Failed"); return; }
      setModules((prev) =>
        prev.map((m) =>
          m.id === moduleId
            ? {
                ...m,
                lessons: m.lessons.map((l) =>
                  l.id === lessonId ? { ...l, ...data } : l
                ),
              }
            : m
        )
      );
      setEditingLessonId(null);
      toast.success("Lesson saved");
    });
  }

  function handleDeleteLesson(moduleId: number, lesson: Lesson) {
    setDeleteLessonTarget(null);
    startTransition(async () => {
      const res = await adapter.deleteLesson(courseId, moduleId, lesson.id);
      if (!res.success) { setError(res.message ?? "Failed"); return; }
      setModules((prev) =>
        prev.map((m) =>
          m.id === moduleId
            ? { ...m, lessons: m.lessons.filter((l) => l.id !== lesson.id) }
            : m
        )
      );
      toast.success("Lesson deleted");
    });
  }

  function handleToggleFree(moduleId: number, lesson: Lesson) {
    const nowFree = !lesson.isFree;
    startTransition(async () => {
      const res = await adapter.updateLesson(courseId, moduleId, lesson.id, {
        isFree: nowFree,
      });
      if (!res.success) { setError(res.message ?? "Failed"); return; }
      setModules((prev) =>
        prev.map((m) =>
          m.id === moduleId
            ? {
                ...m,
                lessons: m.lessons.map((l) =>
                  l.id === lesson.id ? { ...l, isFree: nowFree } : l
                ),
              }
            : m
        )
      );
      toast.success(nowFree ? "Lesson set to free preview" : "Lesson set to paid");
    });
  }

  function onVideoSourceComplete(
    moduleId: number,
    lessonId: number,
    update: { videoSource: "bunny" | "external"; externalVideoUrl?: string; duration?: number }
  ) {
    setVideoSourceLessonId(null);
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              lessons: m.lessons.map((l) =>
                l.id === lessonId
                  ? {
                      ...l,
                      videoSource: update.videoSource,
                      bunnyStatus: update.videoSource === "bunny" ? "processing" : null,
                      externalVideoUrl: update.externalVideoUrl ?? l.externalVideoUrl,
                      // Bunny: duration isn't known until transcoding finishes (polling
                      // fills it in), so clear any stale value from a replaced video.
                      // External: duration is detected client-side up front.
                      duration: update.videoSource === "bunny" ? 0 : (update.duration ?? l.duration),
                    }
                  : l
              ),
            }
          : m
      )
    );
  }

  const allLessons = modules.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleId: m.id }))
  );
  const editingVideoLesson = videoSourceLessonId
    ? allLessons.find((l) => l.id === videoSourceLessonId)
    : null;
  const editingLesson = editingLessonId
    ? allLessons.find((l) => l.id === editingLessonId)
    : null;
  const previewLesson = previewLessonId
    ? allLessons.find((l) => l.id === previewLessonId)
    : null;

  return (
    <div className="relative space-y-4">
      <ConfirmModal
        open={!!deleteModuleTarget}
        title="Delete Module"
        message={deleteModuleTarget ? <>Delete module <strong>"{deleteModuleTarget.title}"</strong> and all its lessons? This cannot be undone.</> : ""}
        confirmLabel="Yes, Delete Module"
        variant="danger"
        isPending={isPending}
        onConfirm={() => deleteModuleTarget && handleDeleteModule(deleteModuleTarget)}
        onClose={() => setDeleteModuleTarget(null)}
      />
      <ConfirmModal
        open={!!deleteLessonTarget}
        title="Delete Lesson"
        message={deleteLessonTarget ? <>Delete lesson <strong>"{deleteLessonTarget.lesson.title}"</strong>? This cannot be undone.</> : ""}
        confirmLabel="Yes, Delete Lesson"
        variant="danger"
        isPending={isPending}
        onConfirm={() => deleteLessonTarget && handleDeleteLesson(deleteLessonTarget.moduleId, deleteLessonTarget.lesson)}
        onClose={() => setDeleteLessonTarget(null)}
      />
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {modules.length === 0 && !addingModule && (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-400 text-sm mb-3">No modules yet. Add a section to get started.</p>
        </div>
      )}

      {modules.map((mod) => (
        <div
          key={mod.id}
          className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-colors ${
            draggedModuleId === mod.id ? "border-indigo-400 opacity-60" : "border-gray-200"
          }`}
          onDragOver={(e) => { if (draggedModuleId !== null) e.preventDefault(); }}
          onDrop={() => onModuleDrop(mod.id)}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 select-none"
          >
            <span
              draggable
              onDragStart={() => setDraggedModuleId(mod.id)}
              onDragEnd={() => setDraggedModuleId(null)}
              className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0"
              title="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </span>
            <button
              type="button"
              className="text-gray-400"
              onClick={() => toggleModule(mod.id)}
            >
              {expandedModules.has(mod.id) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {editingModuleId === mod.id ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  autoFocus
                  value={editModuleTitle}
                  onChange={(e) => setEditModuleTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameModule(mod.id);
                    if (e.key === "Escape") setEditingModuleId(null);
                  }}
                  className="flex-1 text-sm border border-indigo-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => handleRenameModule(mod.id)}
                  disabled={isPending || !editModuleTitle.trim()}
                  className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingModuleId(null)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <span
                  className="flex-1 font-medium text-gray-900 text-sm cursor-pointer"
                  onClick={() => toggleModule(mod.id)}
                >
                  {mod.title}
                </span>
                <span className="text-xs text-gray-400">{mod.lessons.length} lessons</span>
                <button
                  type="button"
                  onClick={() => { setEditingModuleId(mod.id); setEditModuleTitle(mod.title); }}
                  disabled={isPending}
                  className="p-1 text-gray-400 hover:text-indigo-500 transition-colors"
                  title="Rename module"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteModuleTarget(mod)}
                  disabled={isPending}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>

          {expandedModules.has(mod.id) && (
            <div className="border-t border-gray-100">
              {mod.lessons.map((lesson) => {
                const TypeIcon = LESSON_TYPE_ICONS[lesson.type] ?? Video;
                return (
                  <div
                    key={lesson.id}
                    className={`flex items-center gap-3 px-8 py-3 border-b border-gray-50 hover:bg-gray-50 ${
                      draggedLesson?.lessonId === lesson.id ? "opacity-50" : ""
                    }`}
                    onDragOver={(e) => {
                      if (draggedLesson?.moduleId === mod.id) e.preventDefault();
                    }}
                    onDrop={() => onLessonDrop(mod.id, lesson.id)}
                  >
                    <span
                      draggable
                      onDragStart={() => setDraggedLesson({ moduleId: mod.id, lessonId: lesson.id })}
                      onDragEnd={() => setDraggedLesson(null)}
                      className="cursor-grab active:cursor-grabbing text-gray-200 hover:text-gray-400 flex-shrink-0"
                      title="Drag to reorder"
                    >
                      <GripVertical className="h-4 w-4" />
                    </span>

                    {lesson.videoSource === "external" ? (
                      <Link className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                    ) : (
                      <TypeIcon className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                    )}

                    <span className="flex-1 text-sm text-gray-700">{lesson.title}</span>

                    {formatDuration(lesson.duration) && (
                      <span className="text-[10px] text-gray-400 font-medium tabular-nums">
                        {formatDuration(lesson.duration)}
                      </span>
                    )}

                    <span className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">
                      {lesson.type}
                    </span>

                    {lesson.type === "video" && uploads[lesson.id] ? (
                      <LessonUploadProgress
                        entry={uploads[lesson.id]!}
                        onCancel={() => cancelUpload(lesson.id)}
                      />
                    ) : (
                      <>
                        <VideoStatusBadge lesson={lesson} />

                        {features.preview && lesson.type === "video" && lesson.videoSource && (
                          (lesson.videoSource === "bunny" ? lesson.bunnyStatus === "ready" : true) && (
                            <button
                              type="button"
                              onClick={() => setPreviewLessonId(lesson.id)}
                              title="Preview video"
                              className="flex items-center justify-center h-7 w-7 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors border border-green-200"
                            >
                              <Play className="h-3.5 w-3.5 fill-green-600" />
                            </button>
                          )
                        )}

                        {lesson.type === "video" && (
                          <button
                            type="button"
                            onClick={() => setVideoSourceLessonId(lesson.id)}
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2.5 py-1 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors"
                          >
                            {lesson.videoSource ? "Change Video" : "Add Video"}
                          </button>
                        )}
                      </>
                    )}

                    {lesson.type === "quiz" && (
                      <button
                        type="button"
                        onClick={() => setBuilderLesson({ id: lesson.id, title: lesson.title, kind: "quiz" })}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2.5 py-1 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors"
                      >
                        Edit Quiz
                      </button>
                    )}

                    {lesson.type === "assignment" && (
                      <button
                        type="button"
                        onClick={() => setBuilderLesson({ id: lesson.id, title: lesson.title, kind: "assignment" })}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2.5 py-1 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors"
                      >
                        Edit Assignment
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setEditingLessonId(lesson.id)}
                      disabled={isPending}
                      className="p-1 text-gray-400 hover:text-indigo-500 transition-colors"
                      title="Edit lesson"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    {features.freePreview && (
                      <button
                        type="button"
                        onClick={() => handleToggleFree(mod.id, lesson)}
                        disabled={isPending}
                        title={lesson.isFree ? "Preview: On" : "Preview: Off"}
                        className={`p-1 transition-colors ${lesson.isFree ? "text-green-500" : "text-gray-300 hover:text-gray-400"}`}
                      >
                        {lesson.isFree ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setDeleteLessonTarget({ moduleId: mod.id, lesson })}
                      disabled={isPending}
                      className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}

              <AddLessonRow
                onAdd={(data) => handleAddLesson(mod.id, data)}
                disabled={isPending}
                lessonTypes={features.lessonTypes}
                showFree={features.freePreview}
              />
            </div>
          )}
        </div>
      ))}

      {/* Video source — contained to this (right) column so the rest of the
          page stays interactive while a video uploads. */}
      {videoSourceLessonId !== null && editingVideoLesson && (
        <LessonVideoSource
          lessonId={videoSourceLessonId}
          lessonTitle={editingVideoLesson.title}
          currentSource={editingVideoLesson.videoSource}
          currentExternalUrl={editingVideoLesson.externalVideoUrl}
          onComplete={(update) =>
            onVideoSourceComplete(editingVideoLesson.moduleId, videoSourceLessonId, update)
          }
          onPickFile={(file) => {
            const lessonId = editingVideoLesson.id;
            const moduleId = editingVideoLesson.moduleId;
            void startUpload(lessonId, file, () =>
              onVideoSourceComplete(moduleId, lessonId, { videoSource: "bunny" }),
            );
          }}
          onClose={() => setVideoSourceLessonId(null)}
          setExternalUrlAction={(lessonId, url, duration) =>
            adapter.setExternalUrl(courseId, lessonId, url, duration)
          }
          variant="contained"
        />
      )}

      {/* Lesson edit modal */}
      {editingLessonId !== null && editingLesson && (
        <LessonEditModal
          lesson={editingLesson}
          disabled={isPending}
          onSave={(data) =>
            handleSaveLesson(editingLesson.moduleId, editingLesson.id, data)
          }
          onClose={() => setEditingLessonId(null)}
          lessonTypes={features.lessonTypes}
          showFree={features.freePreview}
          showResources={features.resources}
        />
      )}

      {features.quiz && builderLesson?.kind === "quiz" && (
        <QuizBuilderModal
          lessonId={builderLesson.id}
          lessonTitle={builderLesson.title}
          onClose={() => setBuilderLesson(null)}
          api={assessmentsApi}
        />
      )}

      {features.assignment && builderLesson?.kind === "assignment" && (
        <AssignmentBuilderModal
          lessonId={builderLesson.id}
          lessonTitle={builderLesson.title}
          onClose={() => setBuilderLesson(null)}
          api={assessmentsApi}
        />
      )}

      {/* Lesson preview modal */}
      {previewLessonId !== null && previewLesson && (
        <LessonPreviewModal
          lessonId={previewLessonId}
          lessonTitle={previewLesson.title}
          onClose={() => setPreviewLessonId(null)}
          playbackPath={adapter.playbackPath(previewLessonId)}
        />
      )}

      {addingModule ? (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-4 flex items-center gap-3">
          <input
            autoFocus
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddModule(); if (e.key === "Escape") setAddingModule(false); }}
            placeholder="Module title…"
            className="flex-1 text-sm border-none outline-none bg-transparent font-medium text-gray-900 placeholder:text-gray-400"
          />
          <button
            type="button"
            onClick={handleAddModule}
            disabled={isPending || !newModuleTitle.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => { setAddingModule(false); setNewModuleTitle(""); }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingModule(true)}
          className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 py-2 px-1"
        >
          <Plus className="h-4 w-4" />
          Add Section
        </button>
      )}
    </div>
  );
}

// ── AddLessonRow ─────────────────────────────────────────────────────────────

