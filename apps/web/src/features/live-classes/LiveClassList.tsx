"use client";

import { useState, useTransition } from "react";
import { Calendar, Video, User } from "lucide-react";
import { liveClassesApi, type LiveClass } from "@/features/live-classes/api";

interface Props { classes: LiveClass[] }

const STATUS_COLOR: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  live: "bg-red-100 text-red-600",
  ended: "bg-gray-100 text-gray-500",
  cancelled: "bg-yellow-100 text-yellow-700",
};

export function LiveClassList({ classes }: Props) {
  const [registered, setRegistered] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();

  function handleRsvp(id: number) {
    startTransition(async () => {
      await liveClassesApi.rsvp(id).catch(() => null);
      setRegistered((prev) => new Set(prev).add(id));
    });
  }

  if (classes.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Video className="h-10 w-10 mx-auto mb-3 opacity-40" />
        No upcoming live classes
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {classes.map((cls) => (
        <div
          key={cls.id}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4"
        >
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-gray-900">{cls.title}</h2>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[cls.status] ?? "bg-gray-100 text-gray-500"}`}>
                {cls.status}
              </span>
            </div>
            {cls.description && (
              <p className="text-sm text-gray-500 line-clamp-2">{cls.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(cls.scheduledAt).toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {cls.instructorFirstName} {cls.instructorLastName}
              </span>
            </div>
          </div>

          {cls.status === "scheduled" && (
            <button
              onClick={() => handleRsvp(cls.id)}
              disabled={isPending || registered.has(cls.id)}
              className="shrink-0 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-xl"
            >
              {registered.has(cls.id) ? "Registered ✓" : "Register"}
            </button>
          )}
          {cls.status === "live" && (
            <span className="shrink-0 flex items-center gap-1.5 text-sm font-medium text-red-600 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              Live Now
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
