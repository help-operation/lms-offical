"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, BookOpen, FileText, ChevronDown, Loader2 } from "lucide-react";
import { duplicateCourseAction } from "@/features/courses/actions/courses.actions";
import { toast } from "@repo/ui/sonner";
import type { InstructorCourse, Category } from "@/features/courses/api";

interface CourseRowActionsProps {
  course: InstructorCourse;
  categories?: Category[];
}

export function CourseRowActions({ course }: CourseRowActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const [isPending, startTransition] = useTransition();
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleToggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((v) => !v);
  }

  function handleDuplicate(includeCurriculum: boolean) {
    setOpen(false);
    startTransition(async () => {
      const res = await duplicateCourseAction(course.id, includeCurriculum);
      if (res.success) {
        toast.success(
          includeCurriculum ? "Course + curriculum duplicated" : "Course info duplicated",
          { description: "A draft copy has been created." }
        );
        router.refresh();
      } else {
        toast.error(res.message ?? "Failed to duplicate course");
      }
    });
  }

  const dropdown = open && pos ? (
    <div
      style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 9999 }}
      className="bg-white rounded-xl border border-gray-100 shadow-lg py-1.5 w-52"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
        Duplicate as Draft
      </p>
      <button
        onClick={() => handleDuplicate(false)}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
      >
        <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
        <div>
          <p className="font-medium">Course Info Only</p>
          <p className="text-xs text-gray-400">Settings, price, media</p>
        </div>
      </button>
      <button
        onClick={() => handleDuplicate(true)}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
      >
        <BookOpen className="h-4 w-4 text-brand-500 shrink-0" />
        <div>
          <p className="font-medium">Course + Curriculum</p>
          <p className="text-xs text-gray-400">Info + all modules & lessons</p>
        </div>
      </button>
    </div>
  ) : null;

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/course-builder/${course.id}`}
        className="text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors"
      >
        Edit
      </Link>
      <Link
        href={`/course-builder/${course.id}#curriculum`}
        className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
      >
        Curriculum
      </Link>

      <button
        ref={btnRef}
        onClick={handleToggle}
        disabled={isPending}
        className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm transition-colors disabled:opacity-50"
        title="Duplicate course"
      >
        {isPending
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <Copy className="h-3.5 w-3.5" />}
        <ChevronDown className="h-3 w-3" />
      </button>

      {typeof window !== "undefined" && dropdown && createPortal(dropdown, document.body)}
    </div>
  );
}
