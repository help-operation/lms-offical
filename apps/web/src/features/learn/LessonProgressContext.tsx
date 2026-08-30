"use client";

import { createContext, useContext, useState } from "react";

interface LessonProgressContextValue {
  completedIds: Set<number>;
  markCompleted: (id: number) => void;
}

const LessonProgressContext = createContext<LessonProgressContextValue | null>(null);

export function LessonProgressProvider({
  children,
  initialCompletedIds,
}: {
  children: React.ReactNode;
  initialCompletedIds: number[];
}) {
  const [completedIds, setCompletedIds] = useState(() => new Set(initialCompletedIds));

  function markCompleted(id: number) {
    setCompletedIds((prev) => new Set([...prev, id]));
  }

  return (
    <LessonProgressContext.Provider value={{ completedIds, markCompleted }}>
      {children}
    </LessonProgressContext.Provider>
  );
}

const EMPTY: LessonProgressContextValue = {
  completedIds: new Set<number>(),
  markCompleted: () => {},
};

export function useLessonProgress() {
  return useContext(LessonProgressContext) ?? EMPTY;
}
