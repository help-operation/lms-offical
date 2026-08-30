"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { blogApiBrowser } from "@/features/blog/api/browser";

interface Props {
  postId: number;
  initialCount: number;
  initialLiked: boolean;
  isLoggedIn: boolean;
}

export function BlogLikeButton({ postId, initialCount, initialLiked, isLoggedIn }: Props) {
  const router = useRouter();
  const [count, setCount]   = useState(initialCount);
  const [liked, setLiked]   = useState(initialLiked);
  const [isPending, startTransition] = useTransition();

  function handleLike() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    // Optimistic update
    setLiked((prev) => !prev);
    setCount((prev) => (liked ? prev - 1 : prev + 1));

    startTransition(async () => {
      try {
        const res = await blogApiBrowser.toggleLike(postId);
        setCount(res.data.count);
        setLiked(res.data.liked);
      } catch {
        // Revert on error
        setLiked((prev) => !prev);
        setCount((prev) => (liked ? prev + 1 : prev - 1));
      }
    });
  }

  return (
    <button
      onClick={handleLike}
      disabled={isPending}
      className={`group flex items-center gap-2 px-5 py-2.5 rounded-full border-2 font-medium text-sm transition-all disabled:opacity-60
        ${liked
          ? "border-red-400 bg-red-50 text-red-500 dark:border-red-500/50 dark:bg-red-950/30 dark:text-red-400"
          : "border-gray-200 bg-white text-gray-500 hover:border-red-300 hover:text-red-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-red-500/50 dark:hover:text-red-400"
        }`}
      title={isLoggedIn ? (liked ? "Unlike" : "Like this post") : "Login to like"}
    >
      <Heart
        className={`h-4 w-4 transition-transform group-active:scale-125
          ${liked ? "fill-red-500 text-red-500" : "group-hover:text-red-400"}`}
      />
      <span>{count}</span>
      <span className="hidden sm:inline">{liked ? "Liked" : "Like"}</span>
    </button>
  );
}
