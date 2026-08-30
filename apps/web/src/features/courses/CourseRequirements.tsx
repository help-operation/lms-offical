import { ChevronRight } from "lucide-react";

export function CourseRequirements({
  requirements,
  level,
  language,
}: {
  requirements: string | null;
  level: string;
  language: string;
}) {
  let reqs: string[];

  if (requirements) {
    reqs = requirements
      .split("\n")
      .map((s) => s.replace(/^[•\-*]\s*/, "").trim())
      .filter(Boolean);
  } else {
    // Auto-generated fallback
    reqs = [];
    if (level === "beginner")
      reqs.push("No prior experience needed — perfect for complete beginners");
    if (level === "intermediate")
      reqs.push("Basic understanding of the subject is recommended");
    if (level === "advanced") reqs.push("Solid foundational knowledge required");
    if (level === "beginner_to_advanced")
      reqs.push("Suitable for all levels — starts from the basics and builds up to advanced topics");
    reqs.push(`Course is taught in ${language}`);
    reqs.push("A computer with internet access");
  }

  return (
    <>
      <h2 className="mb-5 text-2xl font-bold text-gray-900 dark:text-white">Requirements</h2>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <ul className="space-y-2">
          {reqs.map((r, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
              <ChevronRight className="h-4 w-4 text-brand-500 shrink-0 mt-0.5 dark:text-brand-400" />
              {r}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
