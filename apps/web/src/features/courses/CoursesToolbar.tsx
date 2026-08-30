"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

function useSetParam() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page"); // reset pagination on filter change
    router.push(`${pathname}?${next.toString()}`);
  };

  return { params, setParam };
}

const TYPE_PILLS: { key: string | null; label: string }[] = [
  { key: null,       label: "All Courses" },
  { key: "live",     label: "Live Course" },
  { key: "recorded", label: "Recorded Course" },
  { key: "free",     label: "Free Course" },
];

export function CoursesTypePills() {
  const { params, setParam } = useSetParam();
  const activeType = params.get("type"); // null = "All" (default)

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center sm:gap-3">
      {TYPE_PILLS.map((p) => {
        const isActive = activeType === p.key;
        return (
          <button
            key={p.key ?? "all"}
            onClick={() => setParam("type", p.key)}
            className={`w-full cursor-pointer whitespace-nowrap rounded-md px-3 py-2 text-center text-xs font-semibold transition-colors sm:w-36 sm:px-4 sm:py-2 sm:text-sm ${
              isActive
                ? "bg-gradient-to-r from-brand-from to-brand-to text-white shadow-md"
                : "border border-brand-200 bg-white text-gray-700 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
