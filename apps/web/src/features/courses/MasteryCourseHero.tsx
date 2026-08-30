import { ChevronRight, Star, Check, Video } from "lucide-react";

/** Convert digits to Bengali numerals */
function toBengaliNumber(n: number): string {
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return n.toLocaleString("en-US").replace(/[0-9]/g, (d) => bengaliDigits[parseInt(d)] || d);
}

/** Simple text overrides keyed by element semantic name. */
export type HeroTextOverrides = Record<string, string>;

export function MasteryCourseHero({
  title,
  categoryName,
  description,
  rating,
  ratingCount,
  thumbnail,
  price,
  discountPrice,
  totalStudents,
  ratingPct,
  textOverrides,
  socialProofImage,
  header,
}: {
  title: string;
  categoryName: string | null;
  description: string | null;
  rating: number | null;
  ratingCount: number;
  thumbnail: string | null;
  price: number;
  discountPrice: number | null;
  totalStudents: number;
  ratingPct?: number;
  textOverrides?: HeroTextOverrides;
  socialProofImage?: string | null;
  header?: { courseTypeLabel?: string };
}) {
  const t = (key: string, fallback: string) => textOverrides?.[key] ?? fallback;

  const discountPct =
    discountPrice && price > 0
      ? Math.round(100 - (discountPrice / price) * 100)
      : 0;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-[1160px] px-[10px] pt-14 pb-8 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* ── Left: text content ── */}
          <div className="space-y-5 order-2 lg:order-1 text-center sm:text-left">
            {/* Title */}
            <h1
              className="text-[20px] sm:text-[30px] font-bold leading-[43px] text-black"
              style={{ fontFamily: "var(--font-poppins), Sans-serif" }}
            >
              {t("title", title)}
            </h1>

            {/* Rating row */}
            <div data-no-text-edit className="flex items-center justify-center sm:justify-start gap-2">
              <span
                data-no-text-edit
                className="text-sm font-bold text-[#e10600]"
                style={{ fontFamily: "var(--font-poppins), Sans-serif" }}
              >
                {(rating ?? 0).toFixed(1)}
              </span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${s <= Math.round(rating ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
                  />
                ))}
              </div>
              <span data-no-text-edit className="text-sm text-gray-500">
                ({ratingCount} Ratings)
              </span>
            </div>

            {/* Description */}
            {(description || textOverrides?.description) && (
              <p
                className="font-medium text-[16px] leading-[24px]"
                style={{ fontFamily: "var(--font-hind-siliguri), Sans-serif", color: "#4A4F5A" }}
              >
                {t("description", description ?? "")}
              </p>
            )}

            {/* CTA + Pricing row */}
            <div data-no-text-edit className="flex flex-nowrap items-center gap-2 sm:gap-4">
              <a
                href="#enroll"
                className="inline-flex items-center gap-1 sm:gap-2 rounded-sm px-3 sm:px-5 py-2 sm:py-2.5 transition-colors shrink-0"
                style={{ fontFamily: '"Hind Siliguri", Sans-serif', fontSize: 15, fontWeight: 500, backgroundColor: '#1E4600', color: '#FFFFFF' }}
              >
                {t("cta", "ব্যাচে ভর্তি হোন")}
                <ChevronRight className="h-4 w-4" />
              </a>

              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {discountPrice ? (
                  <>
                    <span
                      data-no-text-edit
                      className="font-bold text-[14px] sm:text-[26px]"
                      style={{ fontFamily: '"Hind Siliguri", sans-serif', color: '#000000' }}
                    >
                      ৳{toBengaliNumber(discountPrice)}
                    </span>
                    <span
                      data-no-text-edit
                      className="font-bold line-through text-[14px] sm:text-[26px]"
                      style={{ fontFamily: '"Hind Siliguri", sans-serif', color: '#FE0000' }}
                    >
                      ৳{toBengaliNumber(price)}
                    </span>
                  </>
                ) : (
                  <span
                    data-no-text-edit
                    className="font-bold text-[14px] sm:text-[26px]"
                    style={{ fontFamily: '"Hind Siliguri", sans-serif', color: '#000000' }}
                  >
                    {t("price", price === 0 ? "Free" : `৳${toBengaliNumber(price)}`)}
                  </span>
                )}
              </div>

              {discountPct > 0 && (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-brand-600">
                    <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                  </span>
                  <span
                    className="text-[11px] sm:text-sm font-semibold text-brand-600"
                    style={{ fontFamily: "var(--font-hind-siliguri), Sans-serif" }}
                  >
                    {t("promoBadge", "প্রোমো অ্যাপ্লাইড")}
                  </span>
                </div>
              )}
            </div>

            {/* Social proof — always show (text + fallback logos if no image), mirrors admin MasteryHero */}
            <div data-no-text-edit className="space-y-3">
              <p
                className="text-[17px] sm:text-sm text-gray-600"
                style={{ fontFamily: "var(--font-hind-siliguri), Sans-serif" }}
              >
                {t("socialProof", "আমাদের ২০,০০০+ ছাত্রের কর্তৃক আমানিত বিশ্বাসের ও বিশ্বস্ততার প্রমাণ:")}
              </p>
              {socialProofImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={socialProofImage}
                  alt="Trusted by"
                  className="max-h-12 md:max-h-14 w-auto object-contain"
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

          {/* ── Right: course thumbnail ── */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none order-1 lg:order-2 pt-6 lg:pt-8">
            <div
              data-no-text-edit
              data-image-upload
              className="relative aspect-video overflow-hidden rounded-sm shadow-lg"
            >
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={title}
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
            {/* Mobile only — duplicate রেকর্ডেড কোর্স below thumbnail (curriculum header kept as is) */}
            <div className="flex lg:hidden items-center justify-center gap-2 mt-3 text-purple-600" style={{ fontFamily: 'var(--font-hind-siliguri), Sans-serif' }}>
              <Video className="h-4 w-4 text-orange-500" />
              <span className="font-semibold text-[14px]">{header?.courseTypeLabel ?? "রেকর্ডেড কোর্স"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
