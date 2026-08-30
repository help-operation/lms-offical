"use client";

import { useEffect, useRef, useState } from "react";

export interface WhyDifferentFeature {
  title: string;
  description: string;
  image: string;
  bgColor: string;
}

export interface WhyDifferentStat {
  value: string;
  label: string;
  bgColor: string;
}

export interface WhyDifferentData {
  title?: string;
  features?: WhyDifferentFeature[];
  stats?: WhyDifferentStat[];
}

const DEFAULT_FEATURES: WhyDifferentFeature[] = [
  { title: "Live Class", description: "২৪ টি লাইভ ইন্টারঅ্যাকটিভ ক্লাস। সপ্তাহে ২ দিন নির্ধারিত ক্লাস", image: "", bgColor: "bg-red-50 border-red-100" },
  { title: "Job Placement Support", description: "কোর্স শেষে সিভি প্রস্তুত এবং ইন্টারভিউ গাইডলাইন সাপোর্ট প্রদান করা হবে।", image: "", bgColor: "bg-green-50 border-green-100" },
  { title: "Scholarship & Reward", description: "পরীক্ষায় সর্বোচ্চ নম্বর প্রাপ্ত শিক্ষার্থী বিশেষ স্কলারশিপ ও রিওয়ার্ড পাবেন।", image: "", bgColor: "bg-blue-50 border-blue-100" },
  { title: "Assignment & Exam", description: "প্র্যাকটিকাল অ্যাসাইনমেন্ট ও ফাইনাল এক্সাম", image: "", bgColor: "bg-orange-50 border-orange-100" },
  { title: "Live Support", description: "২৪/৭ সাপোর্ট", image: "", bgColor: "bg-green-50 border-green-100" },
  { title: "Certificate", description: "ইন্টারন্যাশনাল ভ্যালিড সার্টিফিকেট", image: "", bgColor: "bg-yellow-50 border-yellow-100" },
];

const DEFAULT_STATS: WhyDifferentStat[] = [
  { value: "3,000", label: "জব প্লেসমেন্ট", bgColor: "bg-green-50" },
  { value: "9,000", label: "লার্নার", bgColor: "bg-blue-50" },
  { value: "83%", label: "কোর্স কমপ্লিশন রেট", bgColor: "bg-yellow-50" },
  { value: "6", label: "লাইভ এবং রেকর্ডেড কোর্স", bgColor: "bg-pink-50" },
];

const BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

function toBengaliNumber(n: number): string {
  return n.toLocaleString("en-US").replace(/[0-9]/g, (d) => BENGALI_DIGITS[Number(d)]!);
}

function parseStatValue(raw: string): { target: number; suffix: string } {
  const match = raw.match(/^([\d,]+)(.*)$/);
  if (!match) return { target: 0, suffix: "" };
  const num = parseInt(match[1]!.replace(/,/g, ""), 10);
  return { target: isNaN(num) ? 0 : num, suffix: match[2] ?? "" };
}

function AnimatedStat({ value, label, bgColor }: WhyDifferentStat) {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(value);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !animated.current) {
          animated.current = true;
          const { target, suffix } = parseStatValue(value);
          if (target === 0) return;
          const duration = 2000;
          const start = performance.now();

          function tick(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * target);
            setDisplay(`${current.toLocaleString("en-US")}${suffix}`);
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className={`${bgColor} rounded-xl text-center flex flex-col items-center justify-center w-full aspect-[265/105]`}>
      <p className="text-gray-900" style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 600 }}>{display}</p>
      <p className="text-gray-500 px-2" style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: 'clamp(14px, 2.5vw, 18px)', fontWeight: 400 }}>{label}</p>
    </div>
  );
}

export function MasteryWhyDifferent({ data }: { data?: WhyDifferentData }) {
  const title = data?.title || "Why This Course is Different?";
  const features = data?.features && data.features.length > 0 ? data.features : DEFAULT_FEATURES;
  const stats = data?.stats && data.stats.length > 0 ? data.stats : DEFAULT_STATS;

  return (
    <div className="mx-auto max-w-[1160px] px-4 sm:px-[10px] py-10">
      <h2
        className="text-center font-bold text-black mb-8"
        style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: 'clamp(28px, 5vw, 35px)' }}
      >
        {title}
      </h2>

      {/* Features grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {features.map((item, index) => (
          <div
            key={index}
            className={`${item.bgColor} border rounded-xl flex items-center w-full aspect-[353/100]`}
          >
            <div className="w-16 sm:w-[74px] h-16 sm:h-[74px] shrink-0 rounded-lg bg-white/80 flex items-center justify-center overflow-hidden ml-1.5">
              {item.image ? (
                <img src={item.image} alt={item.title} className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-lg font-bold text-gray-400">{item.title.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1 flex flex-col justify-center py-1 px-3 min-w-0">
              <p className="text-gray-900 truncate" style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: 'clamp(15px, 2.5vw, 18px)', fontWeight: 500 }}>{item.title}</p>
              <p className="mt-0.5 line-clamp-2" style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: 'clamp(12px, 2vw, 14px)', fontWeight: 400, color: '#1D2939' }}>{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <AnimatedStat key={index} {...stat} />
        ))}
      </div>
    </div>
  );
}
