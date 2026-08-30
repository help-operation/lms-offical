"use client";

import Link from "next/link";
import Image from "next/image";
import { HidePublicHeader } from "./HidePublicHeader";
import { MasteryStickyOfferBar as MasteryStickyOfferBarCore } from "@repo/ui/mastery-sticky-offer-bar";

interface Props {
  courseSlug: string;
  price: number;
  discountPrice: number | null;
  logoUrl: string;
  logoAlt: string;
  timerHours?: string;
  timerMinutes?: string;
  timerSeconds?: string;
  ctaText?: string;
  offerLabel?: string;
  overrides?: Record<string, { backgroundColor?: string; color?: string }>;
}

export function MasteryStickyOfferBar({
  courseSlug,
  price,
  discountPrice,
  logoUrl,
  logoAlt,
  timerHours,
  timerMinutes,
  timerSeconds,
  ctaText = "Enroll Now",
  offerLabel,
  overrides,
}: Props) {
  return (
    <>
      <HidePublicHeader />
      <div className="fixed top-0 left-0 right-0 z-[999]">
        <MasteryStickyOfferBarCore
          overrides={overrides}
          price={price}
          discountPrice={discountPrice}
          timerHours={timerHours}
          timerMinutes={timerMinutes}
          timerSeconds={timerSeconds}
          offerLabel={offerLabel}
          logo={
            logoUrl ? (
              <Link href="/" aria-label={logoAlt}>
                <Image
                  src={logoUrl}
                  alt={logoAlt || "Logo"}
                  width={140}
                  height={44}
                  className="h-10 w-auto object-contain"
                  priority
                />
              </Link>
            ) : (
              <Link href="/" aria-label={logoAlt}>
                <span className="text-gray-900 font-bold text-lg">{logoAlt}</span>
              </Link>
            )
          }
          ctaButton={
            <>
              <style>{`
                @keyframes shimmer {
                  0% { transform: translateX(-150%) skewX(-20deg); }
                  100% { transform: translateX(250%) skewX(-20deg); }
                }
              `}</style>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("enroll");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                style={{
                  background: (overrides as any)?.topbarEnroll?.backgroundColor ?? 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: (overrides as any)?.topbarEnroll?.color ?? 'white',
                  textDecoration: 'none',
                  padding: '12px 24px',
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: 16,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 10px rgba(5, 150, 105, 0.3)',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {ctaText}
              </button>
            </>
          }
        />
      </div>
    </>
  );
}
