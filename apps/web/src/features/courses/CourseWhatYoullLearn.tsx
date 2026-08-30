import { CheckCircle2 } from "lucide-react";

export function CourseWhatYoullLearn({
  learningOutcomes,
  description,
}: {
  learningOutcomes: string | null;
  description: string | null;
}) {
  let points: string[] = [];

  if (learningOutcomes) {
    points = learningOutcomes
      .split("\n")
      .map((s) => s.replace(/^[•\-*]\s*/, "").trim())
      .filter(Boolean);
  } else if (description) {
    // Fallback: derive from description
    points = description
      .split(/[.\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10)
      .slice(0, 8);
  }

  if (points.length === 0) return null;

  return (
    <>
      <h2 className="mb-5 text-2xl font-bold text-gray-900 dark:text-white">What You&apos;ll Learn</h2>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {points.map((pt, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-brand-500 shrink-0 mt-0.5 dark:text-brand-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{pt}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
