"use client";

import * as React from "react";
import { MasteryHero } from "./MasteryHero";
import { MasteryBatchInfo } from "./MasteryBatchInfo";
import { MasteryBenefits } from "./MasteryBenefits";
import { MasteryToolsSection } from "./MasteryToolsSection";
import { MasteryWhyDifferent } from "./MasteryWhyDifferent";
import { MasteryInstructors } from "./MasteryInstructors";
import { MasteryVideoTestimonials } from "./MasteryVideoTestimonials";
import { MasteryTestimonials } from "./MasteryTestimonials";
import { MasteryValueBreakdown } from "./MasteryValueBreakdown";
import { MasteryCurriculum } from "./MasteryCurriculum";

const MASTERY_DEFAULT_ORDER = [
  "batch",
  "curriculum",
  "tools",
  "why",
  "instructors",
  "benefits",
  "videoTestimonials",
  "testimonials",
  "value",
] as const;

function resolveMasteryOrder(saved: string[] | undefined): string[] {
  if (!saved || saved.length === 0) return [...MASTERY_DEFAULT_ORDER];
  const known = new Set(MASTERY_DEFAULT_ORDER as readonly string[]);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of saved) if (known.has(id) && !seen.has(id)) { result.push(id); seen.add(id); }
  for (const id of MASTERY_DEFAULT_ORDER) if (!seen.has(id)) result.push(id);
  return result;
}

export function MasteryCoursePreview({ course }: { course: any }) {
  const isBundle = course?.courseType === "bundle";
  const bundleModules = isBundle && Array.isArray(course?.bundleCurriculum) && course.bundleCurriculum.length > 0
    ? course.bundleCurriculum.map((m: { title: string; lessons: string[] }, idx: number) => ({ id: idx + 1000, title: m.title, lessons: (m.lessons || []).map((t: string, li: number) => ({ id: li + 1000, title: t, type: "video" })) }))
    : null;
  const modules = bundleModules ?? course?.modules ?? [];
  const header = course?.bundleCurriculumHeader ?? undefined;

  const blocks: Record<string, React.ReactNode> = {
    batch: <MasteryBatchInfo items={course.batchInfo} />,
    curriculum: <MasteryCurriculum modules={modules} header={header} />,
    tools: <MasteryToolsSection items={course.toolsInfo} title={course.toolsTitle} />,
    why: <MasteryWhyDifferent data={course.whyDifferentInfo} />,
    instructors: <MasteryInstructors data={course.instructorsInfo} />,
    benefits: <MasteryBenefits data={course.benefitsInfo} />,
    videoTestimonials: <MasteryVideoTestimonials data={course.videoTestimonialsInfo} />,
    testimonials: <MasteryTestimonials data={course.testimonialsInfo} />,
    value: <MasteryValueBreakdown data={course.valueBreakdownInfo} />,
  };

  const order = resolveMasteryOrder(course?.masterySectionOrder as string[] | undefined);

  return (
    <>
      <MasteryHero course={course} />
      {order.map((id) => (blocks[id] ? <React.Fragment key={id}>{blocks[id]}</React.Fragment> : null))}
    </>
  );
}
