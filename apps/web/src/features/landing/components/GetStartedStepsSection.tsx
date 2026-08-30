"use client";

import {
  Check,
  Pencil,
  ListChecks,
  Play,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

export type GetStartedStepsContent = {
  image?: string;
  steps?: { title: string; icon?: string }[];
};

type Props = { content?: GetStartedStepsContent };

const ICON_MAP: Record<string, LucideIcon> = {
  pencil:    Pencil,
  list:      ListChecks,
  play:      Play,
  dashboard: LayoutDashboard,
};

const DEFAULTS: GetStartedStepsContent = {
  image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&h=800&fit=crop",
  steps: [
    { title: "Create an account",            icon: "pencil"    },
    { title: "Select your preferred course", icon: "list"      },
    { title: "Enroll in the course",         icon: "play"      },
    { title: "Open your course dashboard",   icon: "dashboard" },
  ],
};

const GetStartedStepsSection = ({ content = {} }: Props) => {
  const d = { ...DEFAULTS, ...content } as Required<GetStartedStepsContent>;
  const steps = Array.isArray(d.steps) && d.steps.length > 0 ? d.steps : DEFAULTS.steps ?? [];
  const [active, setActive] = useState(0);

  return (
    <section className="bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:via-[#160f2e] dark:to-gray-900 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="rounded-3xl border border-brand-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6 sm:p-10 lg:p-14">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            {/* Left — image */}
            <div className="overflow-hidden rounded-2xl shadow-md">
              <img src={d.image} alt="Get started" className="h-full w-full object-cover" />
            </div>

            {/* Right — stepper */}
            <ol className="relative flex flex-col gap-5">
              {steps.map((s, i) => {
                const Icon = ICON_MAP[s.icon ?? "pencil"] ?? Pencil;
                const isActive = i === active;
                const isDone = i < active;
                return (
                  <li key={i} className="relative flex items-center gap-5">
                    {/* Connector line */}
                    {i < steps.length - 1 && (
                      <span className="absolute left-[18px] top-10 h-[calc(100%-8px)] w-px border-l-2 border-dashed border-gray-300 dark:border-gray-600" />
                    )}

                    {/* Number / check bubble */}
                    <span
                      className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                        isActive || isDone
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {isDone ? <Check className="h-4 w-4" /> : i + 1}
                    </span>

                    {/* Step card */}
                    <button
                      onClick={() => setActive(i)}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-5 py-4 text-left transition-colors ${
                        isActive
                          ? "bg-gradient-to-r from-brand-from to-brand-to text-white shadow-md"
                          : "bg-gray-200/70 dark:bg-gray-700/70 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>
                        <span
                          className={`block text-xs ${
                            isActive ? "text-white/80" : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          Step {i + 1}
                        </span>
                        <span className="block text-base font-bold">{s.title}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GetStartedStepsSection;
