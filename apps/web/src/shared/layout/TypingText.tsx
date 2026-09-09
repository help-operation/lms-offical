"use client";

import { useState, useEffect, useCallback } from "react";

const MESSAGES = [
  "Learn Today, Lead Tomorrow",
  "Don't waste your time",
];

const TYPING_SPEED = 70;
const DELETING_SPEED = 40;
const PAUSE_AFTER_TYPING = 2000;
const PAUSE_AFTER_DELETING = 400;

export function TypingText() {
  const [text, setText] = useState("");
  const [msgIndex, setMsgIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const tick = useCallback(() => {
    const current: string = MESSAGES[msgIndex] ?? MESSAGES[0]!;

    if (!isDeleting) {
      setText(current.slice(0, text.length + 1));
      if (text.length + 1 === current.length) {
        setTimeout(() => setIsDeleting(true), PAUSE_AFTER_TYPING);
        return;
      }
    } else {
      setText(current.slice(0, text.length - 1));
      if (text.length - 1 === 0) {
        setIsDeleting(false);
        setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
        return;
      }
    }
  }, [text, msgIndex, isDeleting]);

  useEffect(() => {
    const speed = isDeleting ? DELETING_SPEED : TYPING_SPEED;
    const id = setTimeout(tick, speed);
    return () => clearTimeout(id);
  }, [tick, isDeleting]);

  return (
    <span className="inline-flex items-center gap-0.5">
      <span
        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"
        aria-label={MESSAGES[msgIndex]}
      >
        {text}
      </span>
      <span className="ml-px inline-block h-4 w-px animate-pulse bg-purple-400 dark:bg-purple-300" aria-hidden="true" />
    </span>
  );
}
