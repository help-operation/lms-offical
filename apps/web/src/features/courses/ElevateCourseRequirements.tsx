import { CheckCircle2 } from "lucide-react";

export function ElevateCourseRequirements({
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
      <div className="rounded-2xl border border-brand-100 bg-brand-50/40 p-6 transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900">
        <ul className="space-y-3">
          {reqs.map((r, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm dark:bg-gray-800 dark:text-brand-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
              <span className="pt-0.5">{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
