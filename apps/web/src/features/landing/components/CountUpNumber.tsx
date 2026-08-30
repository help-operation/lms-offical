"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

type Props = { value: string; className?: string };

export function CountUpNumber({ value, className }: Props) {
  // Split leading number from suffix: "500+" → ["500", "+"], "2M+" → ["2", "M+"]
  const match = value.match(/^(\d+(?:\.\d+)?)(.*)/);
  const target = match ? parseFloat(match[1]!) : 0;
  const suffix = match ? match[2] : value;

  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    const duration = 1800;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [isInView, target]);

  return (
    <span ref={ref} className={className}>
      {count}
      {suffix}
    </span>
  );
}
