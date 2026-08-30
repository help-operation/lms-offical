import { Star } from "lucide-react";

export function CourseHero({
  title,
  categoryName,
  description,
  rating,
  ratingPct,
  textOverrides,
}: {
  title: string;
  categoryName: string | null;
  description: string | null;
  rating: number | null;
  ratingPct: number;
  textOverrides?: Record<string, string>;
}) {
  return (
    <div className="bg-gradient-to-r from-surface-cta via-surface-cta-mid to-surface-teal text-white">
      <div className="container mx-auto px-4 pb-12 pt-12">
        <div className="lg:w-2/3">
          {categoryName && (
            <span className="mb-3 inline-block rounded-full bg-brand-900/30 px-3 py-1 text-xs font-semibold text-brand-200">
              {categoryName}
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{title}</h1>

          <div className="mt-3 flex items-center gap-2 text-sm">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-4 w-4 ${s <= Math.round(rating ?? 5) ? "fill-amber-400 text-amber-400" : "text-white/30"}`}
                />
              ))}
            </div>
            <span className="text-brand-100">
              ({ratingPct}% of students rated this course 5★)
            </span>
          </div>

          {description && (
            <p className="mt-4 max-w-2xl text-brand-50/90 leading-relaxed line-clamp-3">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
