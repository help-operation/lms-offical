/* eslint-disable @next/next/no-img-element */
"use client";

import { CheckCircle2, Sparkle } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import type {
  PublicCourseDetail,
  CurriculumModule,
  CourseReviews,
} from "@/features/courses/api";
import { ElevateCourseSectionNav } from "@/features/courses/ElevateCourseSectionNav";
import { ElevateCourseDisclosure } from "@/features/courses/ElevateCourseDisclosure";
import { ContentPreview } from "@/features/courses/ContentPreview";
import { ElevateReviewForm } from "@/features/courses/ElevateReviewForm";
import { ElevateCourseInstructorCard } from "@/features/courses/ElevateCourseInstructorCard";
import { CourseWhatYoullLearn } from "@/features/courses/CourseWhatYoullLearn";
import { ElevateCourseRequirements } from "@/features/courses/ElevateCourseRequirements";
import { ElevateCourseReviewsSection } from "@/features/courses/ElevateCourseReviewsSection";
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

export function ElevateCourseContent({
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

  const RENDERERS: Record<string, () => ReactNode> = {
    instructor: () => (
      <section id="instructor" className="scroll-mt-36">
        <ElevateCourseInstructorCard
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {facilities.map((f, i) => {
            const Icon = getFacilityIcon(f.icon);
            return (
              <div
                key={i}
                className="group rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-900/5 dark:border-gray-800 dark:from-gray-900 dark:to-gray-900 dark:hover:shadow-black/20"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm transition-transform group-hover:scale-105 dark:bg-gray-800 dark:text-brand-400">
                  <Icon className="h-5 w-5" />
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
        <ElevateCourseDisclosure
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
          <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 p-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            Curriculum will be published shortly.
          </div>
        )}
      </section>
    ),

    certificate: () => (
      <section id="certificate" className="scroll-mt-36">
        <h2 className="mb-5 text-2xl font-bold text-gray-900 dark:text-white">Course certificate</h2>
        <div className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-sm transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900">
          <div className="h-1.5 w-full bg-gradient-to-r from-brand-400 via-brand-600 to-brand-400" />
          <div className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
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
                className="mt-6 w-full rounded-2xl border border-brand-100 object-contain dark:border-gray-800"
              />
            ) : (
              <div className="mt-6 rounded-2xl border-2 border-dashed border-brand-200 bg-gradient-to-br from-brand-50 to-white p-8 text-center dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
                <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white">
                  <Sparkle className="h-5 w-5 fill-current" />
                </span>
                <p className="font-serif text-2xl font-bold text-brand-700 dark:text-brand-400">
                  Certificate of Completion
                </p>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">This is to certify that</p>
                <p className="mt-1 text-xl font-extrabold tracking-wide text-gray-900 dark:text-white">
                  YOUR <span className="text-brand-600 dark:text-brand-400">NAME</span>
                </p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                  has successfully completed &ldquo;{course.title}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    ),

    reviews: () => (
      <section id="reviews" className="scroll-mt-36">
        <h2 className="mb-5 text-2xl font-bold text-gray-900 dark:text-white">What students say</h2>
        <div className="space-y-6">
          <ElevateReviewForm
            courseId={course.id}
            isEnrolled={isEnrolled}
            isLoggedIn={isLoggedIn}
          />
          <ElevateCourseReviewsSection data={reviews} />
        </div>
      </section>
    ),

    requirements: () => (
      <section id="requirements" className="scroll-mt-36">
        <ElevateCourseRequirements
          requirements={course.requirements}
          level={course.level}
          language={course.language}
        />
      </section>
    ),

    payment: () => (
      <section id="payment" className="scroll-mt-36">
        <h2 className="mb-5 text-2xl font-bold text-gray-900 dark:text-white">How to pay</h2>
        <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
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
        <ElevateCourseDisclosure items={faq.map((q) => ({ title: q.question, body: q.answer }))} />
      </section>
    ),

    "more-questions": () => (
      <section id="more-questions" className="scroll-mt-36">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Have more questions?</h2>
        <div className="flex flex-wrap gap-3">
          <a
            href={`tel:${supportPhone}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-brand-200 bg-white px-6 py-4 text-sm font-semibold text-brand-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-50 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:text-brand-400 dark:hover:bg-brand-500/10"
          >
            <PhoneCallIcon /> Call {supportPhone}
          </a>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-[#25D366]/30 bg-white px-6 py-4 text-sm font-semibold text-[#128C7E] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#25D366]/5 hover:shadow-md dark:bg-gray-900 dark:text-[#25D366] dark:hover:bg-[#25D366]/10"
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
      <ElevateCourseSectionNav items={navItems} />

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
