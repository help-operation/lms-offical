/* eslint-disable @next/next/no-img-element */
"use client";

import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import type {
  PublicCourseDetail,
  CurriculumModule,
  CourseReviews,
} from "@/features/courses/api";
import { CourseSectionNav } from "@/features/courses/CourseSectionNav";
import { CourseDisclosure } from "@/features/courses/CourseDisclosure";
import { ContentPreview } from "@/features/courses/ContentPreview";
import { ReviewForm } from "@/features/courses/ReviewForm";
import { CourseInstructorCard } from "@/features/courses/CourseInstructorCard";
import { CourseWhatYoullLearn } from "@/features/courses/CourseWhatYoullLearn";
import { CourseRequirements } from "@/features/courses/CourseRequirements";
import { CourseReviewsSection } from "@/features/courses/CourseReviewsSection";
import { PhoneCallIcon, WhatsAppIcon, PaymentGuideModal } from "@/features/courses/CourseContentMedia";
import {
  DEFAULT_FACILITIES,
  DEFAULT_TARGET_AUDIENCE,
  DEFAULT_CERTIFICATE_PERKS,
  DEFAULT_FAQ,
  DEFAULT_PAYMENT_INSTRUCTIONS,
  DEFAULT_SUPPORT_PHONE,
  getFacilityIcon,
  mergeDetailPageSections,
  buildNavItems,
} from "@/features/courses/course-detail.constants";

export function CourseContent({
  course,
  curriculum,
  reviews,
  isEnrolled,
  isLoggedIn,
  whatsappUrl = "",
  defaultPhone = "",
}: {
  course: PublicCourseDetail;
  curriculum: CurriculumModule[];
  reviews: CourseReviews;
  isEnrolled: boolean;
  isLoggedIn: boolean;
  whatsappUrl?: string;
  defaultPhone?: string;
}) {
  // Per-course content with fallback to defaults
  const facilities        = course.facilities        && course.facilities.length        > 0 ? course.facilities        : DEFAULT_FACILITIES;
  const targetAudience    = course.targetAudience    ?? DEFAULT_TARGET_AUDIENCE;
  const certificatePerks  = course.certificatePerks  && course.certificatePerks.length  > 0 ? course.certificatePerks  : DEFAULT_CERTIFICATE_PERKS;
  const faq               = course.faq               && course.faq.length               > 0 ? course.faq               : DEFAULT_FAQ;
  const paymentInstructions = course.paymentInstructions ?? DEFAULT_PAYMENT_INSTRUCTIONS;
  const supportPhone        = course.supportPhone?.trim() || defaultPhone || DEFAULT_SUPPORT_PHONE;
  const paymentGuideVideo   = course.paymentGuideVideo?.trim() || null;

  const [guideModalOpen, setGuideModalOpen] = useState(false);

  // Resolve section order + visibility (admin-controlled per course)
  const sections = mergeDetailPageSections(course.detailPageSections, course.template);
  const navItems = buildNavItems(sections);

  // Section id → JSX renderer. Each renderer returns the full <section> wrapper
  // so the sticky nav can scroll to its `id`. Sections not in this map are
  // silently skipped — admin can hide via toggle if they don't want them.
  const RENDERERS: Record<string, () => ReactNode> = {
    instructor: () => (
      <section id="instructor" className="scroll-mt-36">
        <CourseInstructorCard
          firstName={course.instructorFirstName}
          lastName={course.instructorLastName}
          avatar={course.instructorAvatar}
          bio={course.instructorBio}
          expertise={course.instructorExpertise}
          totalStudents={course.instructorTotalStudents ?? 0}
          totalCourses={course.instructorTotalCourses ?? 0}
          rating={course.instructorRating}
        />
      </section>
    ),

    structure: () => (
      <section id="structure" className="scroll-mt-36">
        <h2 className="mb-5 text-2xl font-bold text-gray-900 dark:text-white">
          How the course is organized
        </h2>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 sm:grid-cols-2">
          {facilities.map((f, i) => {
            const Icon = getFacilityIcon(f.icon);
            return (
              <div key={i} className="bg-brand-50 p-6 dark:bg-gray-800">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm dark:bg-gray-700">
                  <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                </span>
                <h3 className="mt-3 text-base font-bold text-gray-900 dark:text-white">{f.title}</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    ),

    learn: () => (
      <section id="learn" className="scroll-mt-36">
        <CourseWhatYoullLearn
          learningOutcomes={course.learningOutcomes}
          description={course.description}
        />
      </section>
    ),

    details: () => (
      <section id="details" className="scroll-mt-36">
        <h2 className="mb-5 text-2xl font-bold text-gray-900 dark:text-white">Course details</h2>
        <CourseDisclosure
          items={[
            {
              title: `About the '${course.title}' course`,
              body: course.description ?? "Detailed course information appears here.",
            },
            {
              title: `Who is the '${course.title}' course for`,
              body: targetAudience,
            },
          ]}
        />
      </section>
    ),

    content: () => (
      <section id="content" className="scroll-mt-36">
        <h2 className="mb-5 text-2xl font-bold text-gray-900 dark:text-white">Content preview</h2>
        {curriculum.length > 0 ? (
          <ContentPreview
            modules={curriculum.map((m) => ({
              id: m.id,
              title: m.title,
              lessons: m.lessons.map((l) => ({
                id: l.id,
                title: l.title,
                type: l.type,
                isFree: l.isFree,
              })),
            }))}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
            Curriculum will be published shortly.
          </div>
        )}
      </section>
    ),

    certificate: () => (
      <section id="certificate" className="scroll-mt-36">
        <h2 className="mb-5 text-2xl font-bold text-gray-900 dark:text-white">Course certificate</h2>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-ink-soft dark:text-gray-400">
            On successfully completing this course you get a certificate that you can —
          </p>
          <ul className="mt-4 space-y-2">
            {certificatePerks.map((p, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                {p}
              </li>
            ))}
          </ul>
          {course.certificateImage ? (
            <img
              src={course.certificateImage}
              alt="Course certificate"
              className="mt-6 w-full rounded-xl border border-gray-200 object-contain dark:border-gray-700"
            />
          ) : (
            <div className="mt-6 rounded-xl border-2 border-dashed border-gray-200 bg-surface-cream p-8 text-center dark:border-gray-700 dark:bg-gray-800">
              <p className="font-serif text-2xl font-bold text-red-700 dark:text-red-400">
                Certificate of Completion
              </p>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">This is to certify that</p>
              <p className="mt-1 text-xl font-extrabold tracking-wide text-gray-900 dark:text-white">
                YOUR <span className="text-brand-600 dark:text-brand-400">NAME</span>
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                has successfully completed &ldquo;{course.title}&rdquo;
              </p>
            </div>
          )}
        </div>
      </section>
    ),

    reviews: () => (
      <section id="reviews" className="scroll-mt-36">
        <h2 className="mb-5 text-2xl font-bold text-gray-900 dark:text-white">What students say</h2>
        <div className="space-y-6">
          <ReviewForm
            courseId={course.id}
            isEnrolled={isEnrolled}
            isLoggedIn={isLoggedIn}
          />
          <CourseReviewsSection data={reviews} />
        </div>
      </section>
    ),

    requirements: () => (
      <section id="requirements" className="scroll-mt-36">
        <CourseRequirements
          requirements={course.requirements}
          level={course.level}
          language={course.language}
        />
      </section>
    ),

    payment: () => (
      <section id="payment" className="scroll-mt-36">
        <h2 className="mb-5 text-2xl font-bold text-gray-900 dark:text-white">How to pay</h2>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-ink-soft dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          {paymentInstructions}{" "}
          <button
            type="button"
            onClick={() => paymentGuideVideo && setGuideModalOpen(true)}
            className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            See the payment guide
          </button>
          .
        </div>
      </section>
    ),

    faq: () => (
      <section id="faq" className="scroll-mt-36">
        <h2 className="mb-5 text-2xl font-bold text-gray-900 dark:text-white">
          Frequently asked questions
        </h2>
        <CourseDisclosure items={faq.map((q) => ({ title: q.question, body: q.answer }))} />
      </section>
    ),

    "more-questions": () => (
      <section id="more-questions" className="scroll-mt-36">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Have more questions?</h2>
        <div className="flex flex-wrap gap-3">
          <a
            href={`tel:${supportPhone}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-brand-200 bg-white px-6 py-4 text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-colors dark:border-brand-500/30 dark:bg-gray-800 dark:text-brand-400 dark:hover:bg-gray-700"
          >
            <PhoneCallIcon /> Call {supportPhone}
          </a>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-[#25D366]/30 bg-white px-6 py-4 text-sm font-semibold text-[#128C7E] hover:bg-[#25D366]/5 transition-colors dark:bg-gray-800 dark:hover:bg-[#25D366]/10"
            >
              <WhatsAppIcon /> WhatsApp
            </a>
          )}
        </div>
      </section>
    ),
  };

  return (
    <div className="lg:col-span-2 lg:pt-10">
      <CourseSectionNav items={navItems} />

      <div className="space-y-8 py-10 sm:space-y-12">
        {sections
          .filter((s) => s.enabled)
          .map((s) => {
            const render = RENDERERS[s.id];
            if (!render) return null;
            return <div key={s.id}>{render()}</div>;
          })}
      </div>

      {/* Payment guide video modal */}
      {guideModalOpen && paymentGuideVideo && (
        <PaymentGuideModal
          url={paymentGuideVideo}
          onClose={() => setGuideModalOpen(false)}
        />
      )}
    </div>
  );
}
