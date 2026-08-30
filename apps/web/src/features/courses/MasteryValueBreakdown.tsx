"use client";

import { useEffect, useState } from "react";

export interface ValueItem {
  name: string;
  price: string;
  description: string;
}

export interface ValueBreakdownData {
  title?: string;
  highlightWords?: string;
  items?: ValueItem[];
  offerTitle?: string;
  offerHighlight?: string;
  offerSubtitle1?: string;
  offerSubtitle2?: string;
  timerHours?: string;
  timerMinutes?: string;
  timerSeconds?: string;
  ctaText?: string;
}

const DEFAULT_ITEMS: ValueItem[] = [
  {
    name: "Advanced MS Excel",
    price: "৳২,৬০০",
    description: "ডাটা এনালাইসিস, ফর্মুলা এবং ড্যাশবোর্ড মাস্টারি।",
  },
  {
    name: "Power BI Masterclass",
    price: "৳২,৯৯০",
    description: "বিজনেস ইন্টেলিজেন্স এবং এডভান্সড ভিজ্যুয়ালাইজেশন।",
  },
  {
    name: "MS PowerPoint",
    price: "৳১,৭৮০",
    description: "প্রফেশনাল স্লাইড ডিজাইন এবং এনিমেশন।",
  },
  {
    name: "Professional MS Word",
    price: "৳৬৩০",
    description: "অফিসিয়াল ডকুমেন্টেশন এবং রিপোর্ট রাইটিং।",
  },
];

function renderTitle(title: string, highlightWords?: string) {
  if (!highlightWords) return <>{title}</>;
  const parts = title.split(highlightWords);
  if (parts.length === 1) return <>{title}</>;
  return (
    <>
      {parts[0]}
      <span className="text-red-500 relative inline-block">
        {highlightWords}
        <svg className="absolute left-0 w-full" style={{ bottom: -2, height: 10 }} viewBox="0 0 100 10" preserveAspectRatio="none">
          <path className="underline-path" d="M2,7 C20,2 40,2 50,2 C60,2 80,2 98,7" />
        </svg>
      </span>
      {parts[1]}
    </>
  );
}

function renderOfferTitle(title: string, highlightWords?: string) {
  if (!highlightWords) return <>{title}</>;
  const parts = title.split(highlightWords);
  if (parts.length === 1) return <>{title}</>;
  return (
    <>
      {parts[0]}
      <span className="relative inline-block px-4 py-1">
        <span className="relative z-[2] text-red-600 font-bold">{highlightWords}</span>
        <svg
          className="absolute inset-0 w-full h-full z-[1] pointer-events-none overflow-visible"
          viewBox="0 0 500 150"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M325,18C228.7-8.3,118.5,8.3,78,21C22.4,38.4,4.6,54.6,5.6,77.6c1.4,32.4,52.2,54,142.6,63.7 c66.2,7.1,212.2,7.5,273.5-8.3c64.4-16.6,104.3-57.6,33.8-98.2C386.7-4.9,179.4-1.4,126.3,20.7"
            fill="none"
            stroke="#e30613"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ strokeDasharray: 1500, strokeDashoffset: 1500, animation: "draw-highlight 3.2s ease-in-out infinite" }}
          />
        </svg>
      </span>
      {parts[1]}
    </>
  );
}

export function MasteryValueBreakdown({ data }: { data?: ValueBreakdownData }) {
  const title = data?.title || "চলুন দেখি এই টাকায় আপনি কি পরিমাণ ভ্যালু পাচ্ছেন";
  const highlightWords = data?.highlightWords || "পরিমাণ ভ্যালু";
  const items = data?.items && data.items.length > 0 ? data.items : DEFAULT_ITEMS;

  const offerTitle = data?.offerTitle || "টোটাল ৮,০০০ টাকার বেশি ভ্যালু পাচ্ছেন!";
  const offerHighlight = data?.offerHighlight || "ভ্যালু পাচ্ছেন!";
  const offerSubtitle1 = data?.offerSubtitle1 || "বিশেষ ছাড়ে পাচ্ছেন ২,৯৯০টাকায়! এই অফার চলবে";
  const offerSubtitle2 = data?.offerSubtitle2 || "৫ এপ্রিল পর্যন্ত। এর পর প্রাইস বেড়ে হবে ৮,০০০টাকা।";
  const ctaText = data?.ctaText || "এখনই এনরোল করুন";

  const [hours, setHours] = useState(() => Number(data?.timerHours) || 20);
  const [minutes, setMinutes] = useState(() => Number(data?.timerMinutes) || 7);
  const [seconds, setSeconds] = useState(() => Number(data?.timerSeconds) || 12);

  useEffect(() => {
    if (data?.timerHours !== undefined && data.timerHours !== "") {
      setHours(Number(data.timerHours) || 0);
    }
    if (data?.timerMinutes !== undefined && data.timerMinutes !== "") {
      setMinutes(Number(data.timerMinutes) || 0);
    }
    if (data?.timerSeconds !== undefined && data.timerSeconds !== "") {
      setSeconds(Number(data.timerSeconds) || 0);
    }
  }, [data?.timerHours, data?.timerMinutes, data?.timerSeconds]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prevSec) => {
        if (prevSec > 0) return prevSec - 1;
        setMinutes((prevMin) => {
          if (prevMin > 0) return prevMin - 1;
          setHours((prevHr) => (prevHr > 0 ? prevHr - 1 : 0));
          return 59;
        });
        return 59;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mx-auto max-w-[1160px] px-[10px] py-10">
      <style>{`
        @keyframes draw {
          0%   { stroke-dashoffset: 130; opacity: 1; }
          45%  { stroke-dashoffset: 0;   opacity: 1; }
          70%  { stroke-dashoffset: 0;   opacity: 1; }
          85%  { stroke-dashoffset: 0;   opacity: 0; }
          86%  { stroke-dashoffset: 130; opacity: 0; }
          100% { stroke-dashoffset: 130; opacity: 0; }
        }
        .underline-path {
          fill: none;
          stroke: #EE1414;
          stroke-width: 4;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 130;
          stroke-dashoffset: 130;
          animation: draw 2.6s ease-in-out infinite;
        }
      `}</style>
      {/* ── Section 1: Value Items Breakdown ── */}
      <h2
        className="text-center font-bold text-black mb-4"
        style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: 'clamp(25px, 5vw, 43px)' }}
      >
        {renderTitle(title, highlightWords)}
      </h2>

      <div className="bg-purple-50/60 rounded-2xl p-6 md:p-10 border border-purple-100/80">
        <div className="space-y-0 divide-y divide-gray-200">
          {items.map((item, index) => (
            <div key={index} className="py-5 first:pt-0 last:pb-0">
              <div className="flex items-baseline gap-2">
                <span
                  className="font-bold text-gray-900 shrink-0 text-base md:text-lg"
                  style={{ fontFamily: '"Hind Siliguri", sans-serif' }}
                >
                  {index + 1}. {item.name}
                </span>
                <span className="flex-1 border-b-2 border-dotted border-gray-400 mb-1 mx-2" />
                <span
                  className="font-bold text-red-600 shrink-0 text-base md:text-lg"
                  style={{ fontFamily: '"Hind Siliguri", sans-serif' }}
                >
                  {item.price}
                </span>
              </div>
              <p
                className="text-sm text-gray-600 mt-1"
                style={{ fontFamily: '"Hind Siliguri", sans-serif' }}
              >
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="my-8" style={{ borderTop: '2px solid #000' }} />

      {/* ── Section 2: Offer & Countdown Timer ── */}
      <div className="text-center">
        <h2
          className="text-center font-bold text-black mb-6"
        style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: 'clamp(25px, 5vw, 43px)' }}
        >
          {renderOfferTitle(offerTitle, offerHighlight)}
        </h2>

        {/* Offer Box */}
        <div className="border-2 border-dotted border-red-400 bg-white rounded-xl p-6 md:p-8 mx-auto text-center shadow-sm">
          <p
            className="text-gray-900 leading-relaxed"
            style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: 'clamp(22px, 5vw, 32px)', fontWeight: 600, lineHeight: '1.8em', color: '#000000' }}
          >
            {offerSubtitle1}
          </p>
          <p
            className="text-gray-900 leading-relaxed mb-6"
            style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: 'clamp(22px, 5vw, 32px)', fontWeight: 600, lineHeight: '1.8em', color: '#000000' }}
          >
            {offerSubtitle2}
          </p>

          {/* Countdown Boxes */}
          <div className="flex justify-center items-center gap-3 md:gap-4">
            <div style={{ padding: 10, backgroundColor: '#FFE4E4', borderStyle: 'dotted', borderWidth: 3, borderColor: '#FF0000', borderRadius: 5, lineHeight: 1 }} className="flex flex-col items-center justify-center sm:w-[123px] sm:h-[80px]">
              <span className="block text-black" style={{ fontSize: 35, fontWeight: 600 }}>
                {String(hours).padStart(2, "0")}
              </span>
              <span
                className="block text-gray-700 font-medium"
                style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: 19, lineHeight: 1 }}
              >
                ঘণ্টা
              </span>
            </div>
            <div style={{ padding: 10, backgroundColor: '#FFE4E4', borderStyle: 'dotted', borderWidth: 3, borderColor: '#FF0000', borderRadius: 5, lineHeight: 1 }} className="flex flex-col items-center justify-center sm:w-[123px] sm:h-[80px]">
              <span className="block text-black" style={{ fontSize: 35, fontWeight: 600 }}>
                {String(minutes).padStart(2, "0")}
              </span>
              <span
                className="block text-gray-700 font-medium"
                style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: 19, lineHeight: 1 }}
              >
                মিনিট
              </span>
            </div>
            <div style={{ padding: 10, backgroundColor: '#FFE4E4', borderStyle: 'dotted', borderWidth: 3, borderColor: '#FF0000', borderRadius: 5, lineHeight: 1 }} className="flex flex-col items-center justify-center sm:w-[123px] sm:h-[80px]">
              <span className="block text-black" style={{ fontSize: 35, fontWeight: 600 }}>
                {String(seconds).padStart(2, "0")}
              </span>
              <span
                className="block text-gray-700 font-medium"
                style={{ fontFamily: '"Hind Siliguri", sans-serif', fontSize: 19, lineHeight: 1 }}
              >
                সেকেন্ড
              </span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => {
              const el = document.getElementById("enroll") || document.getElementById("checkout");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-md shadow-md transition-all"
            style={{ fontFamily: '"Hind Siliguri", sans-serif', width: 165, height: 39, fontSize: 15 }}
          >
            {ctaText}
          </button>
        </div>
      </div>
    </div>
  );
}