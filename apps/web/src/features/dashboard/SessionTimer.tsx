"use client";

import { useState, useEffect } from "react";

export function SessionTimer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return (
    <span className="tabular-nums">
      {hrs > 0 && <>{String(hrs).padStart(2, "0")}: </>}
      {String(mins).padStart(2, "0")}: {String(secs).padStart(2, "0")}
    </span>
  );
}
