"use client";

import { Star, ChevronRight, Check, Video } from "lucide-react";

export function MasteryHero({ course }: { course: any }) {
  const rating = course.rating ? Number(course.rating) : 0;
  const ratingCount = course.ratingCount ?? 0;
  const discountPct =
    course.discountPrice && course.price > 0
      ? Math.round(100 - (course.discountPrice / course.price) * 100)
      : 0;
  const socialProof = course.styleOverrides?.heroSocialProof?.text || "আমাদের ২০,০০০+ স্টুডেন্ট কর্মরত আছেন বিভিন্ন দেশি ও বিদেশি প্রতিষ্ঠানে:";

  return (
    <>
      <section className="bg-white">
        <div className="mx-auto max-w-[1160px] px-[10px] py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* ── Left: text content ─────────────────────────────── */}
            <div className="space-y-5">
              {/* Title */}
              <h1
                className="text-[26px] sm:text-[30px] font-bold leading-[43px] text-black"
                style={{ fontFamily: '"Poppins", Sans-serif' }}
              >
                {course.title || "Complete Office Professional Course With Expert Mentors"}
              </h1>

              {/* Rating row */}
              <div data-no-text-edit className="flex items-center gap-2">
                <span
                  data-no-text-edit
                  className="text-sm font-bold text-[#e10600]"
                  style={{ fontFamily: '"Poppins", Sans-serif' }}
                >
                  {rating.toFixed(1)}
                </span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3].map((i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <span data-no-text-edit className="text-sm text-gray-500">
                  ({ratingCount} Ratings)
                </span>
              </div>

              {/* Description */}
              <p
                className="font-medium text-[16px] leading-[24px]"
                style={{ fontFamily: '"Hind Siliguri", Sans-serif', color: "#4A4F5A" }}
              >
                {course.shortDescription ||
                  "বেসিক টু অ্যাডভান্সড Ms Excel, Ms Word, Ms PowerPoint এবং Power BI শিখুন সরাসরি লাইভ ক্লাসে। প্রতিটি ক্লাসের সাথে পাবেন হ্যান্ডস-অন প্রজেক্ট এবং মেন্টর সাপোর্ট।"}
              </p>

              {/* CTA + Pricing row */}
              <div className="flex flex-wrap items-center gap-4">
                {/* CTA button */}
                <a
                  href="#enroll"
                  className="inline-flex items-center gap-2 rounded-sm px-5 py-2.5 transition-colors"
                  style={{ fontFamily: '"Hind Siliguri", Sans-serif', fontSize: 15, fontWeight: 500, backgroundColor: '#1E4600', color: '#FFFFFF' }}
                >
                  {course.styleOverrides?.cta?.text ?? course.styleOverrides?.heroCta?.text ?? "ব্যাচে ভর্তি হোন"}
                  <ChevronRight className="h-4 w-4" />
                </a>

                {/* Pricing */}
                <div className="flex items-center gap-2">
                  {course.discountPrice ? (
                    <>
                      <span
                        data-no-text-edit
                        className="text-xl font-bold text-[#e10600]"
                        style={{ fontFamily: '"Hind Siliguri", Sans-serif' }}
                      >
                        ৳{Number(course.discountPrice).toLocaleString()}
                      </span>
                      <span data-no-text-edit className="text-sm text-gray-400 line-through">
                        ৳{Number(course.price).toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <span
                      data-no-text-edit
                      className="text-xl font-bold text-black"
                      style={{ fontFamily: '"Hind Siliguri", Sans-serif' }}
                    >
                      {course.price == 0 || course.price === "0"
                        ? "Free"
                        : `৳${Number(course.price).toLocaleString()}`}
                    </span>
                  )}
                </div>

                {/* Promo badge */}
                {discountPct > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600">
                      <Check className="h-3 w-3 text-white" />
                    </span>
                    <span
                      className="text-sm font-semibold text-brand-600"
                      style={{ fontFamily: '"Hind Siliguri", Sans-serif' }}
                    >
                      প্রোমো অ্যাপ্লাইড
                    </span>
                  </div>
                )}
              </div>

              {/* Social proof */}
              <div data-no-text-edit className="space-y-3">
                <p
                  className="text-sm text-gray-600"
                  style={{ fontFamily: '"Hind Siliguri", Sans-serif' }}
                >
                  {socialProof}
                </p>
                {course.socialProofImage ? (
                  <img
                    src={course.socialProofImage}
                    alt="Trusted by"
                    className="h-8 md:h-10 w-auto object-contain opacity-70"
                  />
                ) : (
                  <div className="flex flex-wrap items-center gap-5 text-gray-400">
                    {["Islami Bank", "DBBL", "JTI", "Grameenphone", "BRAC"].map(
                      (name) => (
                        <span
                          key={name}
                          className="text-xs font-semibold tracking-wide opacity-60"
                        >
                          {name}
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Right: course thumbnail ────────────────────────── */}
            <div className="relative mx-auto w-full max-w-md lg:max-w-none pt-6 lg:pt-8">
              <div
                data-no-text-edit
                data-image-upload
                className="relative aspect-video overflow-hidden rounded-sm shadow-lg"
              >
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-700 to-brand-900">
                    <span className="text-sm font-semibold text-white/50">
                      Course Thumbnail
                    </span>
                  </div>
                )}
              </div>
              {/* Mobile only — duplicate রেকর্ডেড কোর্স below thumbnail */}
              <div className="flex lg:hidden items-center justify-center gap-2 mt-3 text-purple-600" style={{ fontFamily: '"Hind Siliguri", Sans-serif' }}>
                <Video className="h-4 w-4 text-orange-500" />
                <span className="font-semibold text-[14px]">{course.bundleCurriculumHeader?.courseTypeLabel ?? "রেকর্ডেড কোর্স"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
