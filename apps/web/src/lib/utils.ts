export function progressOf(e: { totalLessons: number; completedLessons: number }): number {
  return e.totalLessons > 0 ? Math.round((e.completedLessons / e.totalLessons) * 100) : 0;
}
