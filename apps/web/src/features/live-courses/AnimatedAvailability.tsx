"use client";

import { useEffect, useState } from "react";

// Cycles the availability label through both phrases, one after the other,
// each entering with a fade-in and a continuous shimmer/shine sweep.
const PHRASES = ["Limited seats available", "Register now"];

export function AnimatedAvailability() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((p) => (p + 1) % PHRASES.length),
      3000,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <span className="text-sm font-semibold">
      {/* key forces a remount on each swap so the fade-in replays */}
      <span key={index} className="text-shimmer-green inline-block">
        {PHRASES[index]}
      </span>
    </span>
  );
}
