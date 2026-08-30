"use client";

import { CheckCircle2, Lock } from "lucide-react";
import { useLessonProgress } from "./LessonProgressContext";

interface LessonStatusDotProps {
  lessonId: number;
  isActive: boolean;
  isLocked?: boolean;
}

export function LessonStatusDot({ lessonId, isActive, isLocked }: LessonStatusDotProps) {
  const { completedIds } = useLessonProgress();

  if (isLocked) {
    return <Lock className="h-4 w-4 flex-shrink-0 text-gray-600" />;
  }

  if (completedIds.has(lessonId)) {
    return <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />;
  }

  return (
    <span
      className={`h-4 w-4 flex-shrink-0 rounded-full border ${
        isActive ? "border-brand-400" : "border-gray-600"
      }`}
    />
  );
}
