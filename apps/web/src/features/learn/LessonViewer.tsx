"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Loader2, FileText, Download, Clock, Video, ChevronLeft, ChevronRight, CheckCircle2, HelpCircle, ClipboardList, NotebookPen } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@repo/ui/sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@repo/ui/tabs";
import { progressApiBrowser as progressApi } from "@/features/learn/api/progress/browser";
import { useLessonProgress } from "./LessonProgressContext";
import {
  lessonsApiBrowser,
  type LessonResource,
} from "@/features/learn/api/lessons/browser";
import { liveCurriculumApiBrowser } from "@/features/live-courses/api/browser";
import { QuizRunner } from "./QuizRunner";
import { AssignmentView } from "./AssignmentView";
import { LessonNotes } from "./LessonNotes";

type PlaybackInfo =
  | { source: "bunny"; iframeUrl: string; status: "processing" | "ready" | "failed" | null }
  | { source: "external"; url: string };

export type ViewerLessonType = "video" | "text" | "quiz" | "assignment";

export interface ViewerLesson {
  id: number;
  title: string;
  type: ViewerLessonType;
  content?: string | null;
  duration?: number;
}

interface LessonViewerProps {
  variant: "recorded" | "live";
  lesson: ViewerLesson;
  prevHref?: string | null;
  nextHref?: string | null;
  initialCompleted?: boolean;
}

function fmtDuration(sec?: number): string | null {
  if (!sec || sec <= 0) return null;
  if (sec >= 3600) return `${(sec / 3600).toFixed(1)} hours`;
  if (sec >= 60) return `${Math.round(sec / 60)} minutes`;
  return `${sec} sec`;
}

function toEmbedUrl(url: string): { kind: "iframe" | "video"; src: string; platform: "youtube" | "vimeo" | "other" | "video" } {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v");
      if (id) return { kind: "iframe", src: `https://www.youtube.com/embed/${id}?enablejsapi=1`, platform: "youtube" };
    }
    if (host === "youtu.be") {
      return { kind: "iframe", src: `https://www.youtube.com/embed${u.pathname}?enablejsapi=1`, platform: "youtube" };
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return { kind: "iframe", src: `https://player.vimeo.com/video/${id}?api=1`, platform: "vimeo" };
    }
    if (/\.(mp4|webm|ogg|mov|m3u8)$/i.test(u.pathname)) {
      return { kind: "video", src: url, platform: "video" };
    }
  } catch {
    /* not a valid URL */
  }
  return { kind: "iframe", src: url, platform: "other" };
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-black dark:border-white/10" style={{ aspectRatio: "16/9" }}>
      {children}
    </div>
  );
}

function VideoArea({
  lesson,
  variant,
  onProgress,
}: {
  lesson: ViewerLesson;
  variant: "recorded" | "live";
  onProgress: (percent: number) => void;
}) {
  const [playback, setPlayback] = useState<PlaybackInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPlayback(null);
    const fetcher =
      variant === "recorded"
        ? lessonsApiBrowser.playback(lesson.id)
        : liveCurriculumApiBrowser.playback(lesson.id);
    fetcher
      .then((res) => { if (!cancelled) setPlayback(res.data as PlaybackInfo); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Video not available"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [lesson.id, variant]);

  // ── postMessage tracking for Bunny / YouTube / Vimeo iframes ─────────────────
  useEffect(() => {
    if (!playback) return;

    const handleMessage = (e: MessageEvent) => {
      let data: Record<string, unknown> | null = null;
      if (typeof e.data === "string") {
        try { data = JSON.parse(e.data); } catch { return; }
      } else if (e.data && typeof e.data === "object") {
        data = e.data as Record<string, unknown>;
      }
      if (!data) return;

      // ── Bunny: reply to its own "ready" event by subscribing to timeupdate.
      // Doing this on the iframe's DOM `load` event (like YouTube/Vimeo below)
      // fires too early — Bunny's player.js script inside the iframe announces
      // readiness itself via this message, and any subscribe request sent
      // before that is silently dropped.
      if (data.context === "player.js" && data.event === "ready") {
        try {
          (e.source as Window | null)?.postMessage(
            JSON.stringify({
              context: "player.js",
              version: "0.0.1",
              method: "addEventListener",
              value: "timeupdate",
            }),
            e.origin,
          );
        } catch { /* cross-origin guard */ }
        return;
      }

      // ── Bunny (player.js protocol): {event:"timeupdate", value:{seconds:X, duration:Y}} ──
      if (
        data.event === "timeupdate" &&
        data.value && typeof data.value === "object"
      ) {
        const v = data.value as Record<string, unknown>;
        const ct = (v.seconds ?? v.currentTime) as number | undefined;
        const dur = (v.duration as number | undefined) ?? lesson.duration ?? 0;
        if (typeof ct === "number" && dur > 0) {
          onProgress(ct / dur);
          return;
        }
      }
      // ── Bunny: {event:"timeupdate", seconds:X} ──────────────────────────────
      if (data.event === "timeupdate" && typeof data.seconds === "number") {
        const dur = (lesson.duration ?? 0);
        if (dur > 0) onProgress(data.seconds / dur);
        return;
      }
      // Bunny alternate format: {event:"timeupdate", data:{currentTime:X, duration:Y}}
      if (
        data.event === "timeupdate" &&
        data.data && typeof data.data === "object" &&
        typeof (data.data as Record<string, unknown>).currentTime === "number"
      ) {
        const d = data.data as Record<string, unknown>;
        const ct = d.currentTime as number;
        const dur = (d.duration as number | undefined) ?? lesson.duration ?? 0;
        if (dur > 0) onProgress(ct / dur);
        return;
      }

      // ── YouTube: {event:"infoDelivery", info:{currentTime:X, duration:Y}} ───
      if (
        data.event === "infoDelivery" &&
        data.info && typeof data.info === "object"
      ) {
        const info = data.info as Record<string, unknown>;
        const ct = info.currentTime as number | undefined;
        const dur = info.duration as number | undefined;
        if (typeof ct === "number" && typeof dur === "number" && dur > 0) {
          onProgress(ct / dur);
        }
        return;
      }

      // ── Vimeo: {event:"timeupdate", data:{percent:X}} ──────────────────────
      if (
        data.event === "timeupdate" &&
        data.data && typeof data.data === "object" &&
        typeof (data.data as Record<string, unknown>).percent === "number"
      ) {
        onProgress((data.data as Record<string, unknown>).percent as number);
        return;
      }
    };

    window.addEventListener("message", handleMessage);

    // Tell YouTube/Vimeo to start sending events once iframe loads
    const iframe = iframeRef.current;
    if (iframe) {
      const initIframe = () => {
        const src = iframe.src ?? "";
        if (src.includes("youtube.com")) {
          // Ask YouTube to start delivering info
          try {
            iframe.contentWindow?.postMessage(
              JSON.stringify({ event: "listening", id: 1, channel: "widget" }),
              "*",
            );
          } catch { /* cross-origin guard */ }
        } else if (src.includes("vimeo.com")) {
          // Subscribe to Vimeo timeupdate events
          try {
            iframe.contentWindow?.postMessage(
              JSON.stringify({ method: "addEventListener", value: "timeupdate" }),
              "https://player.vimeo.com",
            );
          } catch { /* cross-origin guard */ }
        }
        // Bunny is intentionally not handled here — its player.js script
        // finishes initializing after the iframe's DOM `load` event, so we
        // subscribe in response to its own "ready" postMessage instead (above).
      };
      iframe.addEventListener("load", initIframe);
      // Also attempt immediately (iframe may already be loaded)
      initIframe();
      return () => {
        window.removeEventListener("message", handleMessage);
        iframe.removeEventListener("load", initIframe);
      };
    }

    return () => window.removeEventListener("message", handleMessage);
  }, [playback, lesson.duration, onProgress]);

  if (loading)
    return (
      <Frame>
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
        </div>
      </Frame>
    );

  if (error || !playback)
    return (
      <Frame>
        <div className="absolute inset-0 flex items-center justify-center text-center text-gray-500">
          <div>
            <div className="mb-2 text-4xl">🎬</div>
            <p className="text-sm">{error ?? "Video not yet available"}</p>
          </div>
        </div>
      </Frame>
    );

  if (playback.source === "bunny") {
    if (playback.status && playback.status !== "ready")
      return (
        <Frame>
          <div className="absolute inset-0 flex items-center justify-center text-center text-gray-500">
            <div>
              <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
              <p className="text-sm">Video is still processing…</p>
            </div>
          </div>
        </Frame>
      );
    // Append &api=true so Bunny sends postMessage timeupdate events
    const bunnySrc = playback.iframeUrl.includes("api=true")
      ? playback.iframeUrl
      : `${playback.iframeUrl}&api=true`;
    return (
      <Frame>
        <iframe
          ref={iframeRef}
          src={bunnySrc}
          title={lesson.title}
          allow="accelerometer; gyroscope; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </Frame>
    );
  }

  const embed = toEmbedUrl(playback.url);
  return (
    <Frame>
      {embed.kind === "video" ? (
        <video
          src={embed.src}
          controls
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (v.duration > 0) onProgress(v.currentTime / v.duration);
          }}
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <iframe
          ref={iframeRef}
          src={embed.src}
          title={lesson.title}
          allow="accelerometer; gyroscope; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      )}
    </Frame>
  );
}

function TextArea({ lesson }: { lesson: ViewerLesson }) {
  if (!lesson.content?.trim())
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 dark:border-white/10 dark:bg-[#121217] dark:text-gray-500">
        <FileText className="mx-auto mb-2 h-8 w-8" />
        <p className="text-sm">No content for this lesson yet.</p>
      </div>
    );
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#121217]">
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 dark:text-gray-300">{lesson.content}</p>
    </div>
  );
}

const DESCRIPTION_META: Partial<Record<ViewerLessonType, { label: string; icon: typeof Video }>> = {
  video: { label: "Video Description", icon: Video },
  quiz: { label: "Quiz Description", icon: HelpCircle },
  assignment: { label: "Assignment Description", icon: ClipboardList },
};

const TABS_LIST_CLASS =
  "flex h-auto w-full items-center justify-start gap-2 rounded-none border-b border-slate-200 bg-transparent p-0 px-5 py-3 dark:border-white/10";

const TABS_TRIGGER_CLASS =
  "flex items-center gap-2 rounded-xl border border-transparent bg-transparent px-4 py-2 text-sm font-semibold text-slate-500 shadow-none transition-colors hover:bg-slate-100 hover:text-slate-700 data-[state=active]:border-brand-600 data-[state=active]:bg-brand-600 data-[state=active]:text-white data-[state=active]:shadow-sm dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200 dark:data-[state=active]:border-brand-600 dark:data-[state=active]:bg-brand-600 dark:data-[state=active]:text-white";

function LessonExtras({ lesson, variant }: { lesson: ViewerLesson; variant: "recorded" | "live" }) {
  const meta = DESCRIPTION_META[lesson.type];
  const hasDescription = !!meta && !!lesson.content?.trim();

  const DescIcon = meta?.icon ?? FileText;

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#121217]">
      <Tabs defaultValue={hasDescription ? "description" : "notes"}>
        <TabsList className={TABS_LIST_CLASS}>
          {hasDescription && (
            <TabsTrigger value="description" className={TABS_TRIGGER_CLASS}>
              <DescIcon className="h-4 w-4" />
              Description
            </TabsTrigger>
          )}
          <TabsTrigger value="notes" className={TABS_TRIGGER_CLASS}>
            <NotebookPen className="h-4 w-4" />
            My Notes
          </TabsTrigger>
        </TabsList>
        {hasDescription && (
          <TabsContent value="description" className="mt-0 p-5">
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 dark:text-gray-300">
              {lesson.content}
            </p>
          </TabsContent>
        )}
        <TabsContent value="notes" className="mt-0 p-5">
          <LessonNotes lessonId={lesson.id} variant={variant} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LessonResources({ lessonId }: { lessonId: number }) {
  const [resources, setResources] = useState<LessonResource[]>([]);
  useEffect(() => {
    let cancelled = false;
    lessonsApiBrowser
      .getResources(lessonId)
      .then((res) => { if (!cancelled) setResources(res.data); })
      .catch(() => { /* none / not accessible */ });
    return () => { cancelled = true; };
  }, [lessonId]);

  if (resources.length === 0) return null;
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#121217]">
      <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Resources</h3>
      <div className="flex flex-wrap gap-2.5">
        {resources.map((r) => (
          <a
            key={r.id}
            href={r.url}
            target="_blank"
            rel="noreferrer"
            download
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-500"
          >
            <Download className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{r.title}</span>
            <span className="text-[10px] font-semibold uppercase text-brand-200">{r.type}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function VideoDownloadButton({ lessonId }: { lessonId: number }) {
  const [resource, setResource] = useState<LessonResource | null>(null);
  useEffect(() => {
    let cancelled = false;
    setResource(null);
    lessonsApiBrowser
      .getResources(lessonId)
      .then((res) => { if (!cancelled) setResource(res.data[0] ?? null); })
      .catch(() => { /* none / not accessible */ });
    return () => { cancelled = true; };
  }, [lessonId]);

  if (!resource) return null;
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noreferrer"
      download
      className="flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-brand-500 sm:gap-2 sm:px-5 sm:text-sm"
    >
      <Download className="h-4 w-4 flex-shrink-0" />
      Download
    </a>
  );
}

const UNLOCK_THRESHOLD = 0.9; // 90%

export function LessonViewer({ variant, lesson, prevHref, nextHref, initialCompleted }: LessonViewerProps) {
  const { markCompleted } = useLessonProgress();
  const router = useRouter();
  const recorded = variant === "recorded";
  const [completed, setCompleted] = useState(!!initialCompleted);
  const [marking, setMarking] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [assignmentSubmitted, setAssignmentSubmitted] = useState(false);

  useEffect(() => {
    setCompleted(!!initialCompleted);
    setVideoProgress(0);
    setAssignmentSubmitted(false);
  }, [lesson.id, initialCompleted]);

  // Prefetch adjacent lessons so navigation feels instant
  useEffect(() => {
    if (nextHref) router.prefetch(nextHref);
    if (prevHref) router.prefetch(prevHref);
  }, [nextHref, prevHref, router]);

  const handleProgress = useCallback((percent: number) => {
    setVideoProgress((prev) => Math.max(prev, percent));
  }, []);

  const handleAssignmentSubmitted = useCallback(() => {
    setAssignmentSubmitted(true);
  }, []);

  const handleNext = useCallback(async () => {
    if (marking) return;
    if (completed && nextHref) {
      router.push(nextHref);
      return;
    }
    setMarking(true);
    try {
      const res = recorded
        ? await progressApi.markComplete(lesson.id)
        : await liveCurriculumApiBrowser.markComplete(lesson.id);
      setCompleted(true);
      markCompleted(lesson.id);
      if (res.data.courseCompleted) {
        toast.success("Course complete — your certificate is ready! 🎉");
      }
      if (nextHref) {
        router.push(nextHref);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to complete lesson");
    } finally {
      setMarking(false);
    }
  }, [completed, marking, lesson.id, nextHref, router, markCompleted, recorded]);

  const dur = fmtDuration(lesson.duration);
  const isLastLesson = !nextHref;
  const isFirstLesson = !prevHref;

  // Next is unlocked when: already completed, watched >= 90% (video), the
  // assignment has been submitted (assignment), or the type has no gate.
  const isVideo = lesson.type === "video";
  const isAssignment = lesson.type === "assignment";
  const nextUnlocked =
    completed ||
    (isVideo ? videoProgress >= UNLOCK_THRESHOLD : isAssignment ? assignmentSubmitted : true);
  const watchPercent = Math.round(videoProgress * 100);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Title + meta */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600/20 text-brand-600 dark:text-brand-300">
              <Video className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold leading-snug text-slate-900 dark:text-white">{lesson.title}</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-gray-500">
            {dur && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {dur}
              </span>
            )}
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-600 dark:bg-white/5 dark:text-gray-300">
              {lesson.type}
            </span>
          </div>
        </div>

        {isVideo && !nextUnlocked && (
          <div className="flex shrink-0 flex-col items-end gap-1.5 pt-1">
            <span className="text-xs font-medium text-slate-400 dark:text-gray-500">
              Watch to 90% to continue &nbsp;·&nbsp; {watchPercent}%
            </span>
            <div className="h-1.5 w-36 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-300"
                style={{ width: `${Math.min(watchPercent, 100)}%` }}
              />
            </div>
          </div>
        )}

        {isAssignment && !nextUnlocked && (
          <span className="shrink-0 pt-1 text-xs font-medium text-slate-400 dark:text-gray-500">
            Submit your assignment to continue
          </span>
        )}
      </div>

      {/* Content */}
      {lesson.type === "video" && (
        <VideoArea key={`video-${lesson.id}`} lesson={lesson} variant={variant} onProgress={handleProgress} />
      )}
      {lesson.type === "text" && <TextArea key={`text-${lesson.id}`} lesson={lesson} />}
      {lesson.type === "quiz" && (
        <div key={`quiz-${lesson.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#121217]">
          <QuizRunner lessonId={lesson.id} variant={variant} />
        </div>
      )}
      {lesson.type === "assignment" && (
        <div key={`assignment-${lesson.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#121217]">
          <AssignmentView lessonId={lesson.id} variant={variant} onSubmitted={handleAssignmentSubmitted} />
        </div>
      )}

      {recorded && !isVideo && <LessonResources lessonId={lesson.id} />}

      {/* Previous / Next navigation */}
      <div className="mt-8 border-t border-slate-200 pt-5 dark:border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Previous */}
          <button
            onClick={() => prevHref && router.push(prevHref)}
            disabled={isFirstLesson}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5 sm:px-5 sm:text-sm"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            Previous
          </button>

          {/* Right side: Download (video lessons) + Next/Finish button */}
          <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none sm:gap-3">
            {recorded && isVideo && <VideoDownloadButton lessonId={lesson.id} />}
            {!nextUnlocked ? null : isLastLesson ? (
              <button
                onClick={handleNext}
                disabled={completed || marking}
                className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:text-sm"
              >
                {marking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : completed ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : null}
                {completed ? "Completed" : "Finish Course"}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={marking}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-60 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5 sm:px-5 sm:text-sm"
              >
                {marking ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : null}
                Next
                <ChevronRight className="h-4 w-4 shrink-0" />
              </button>
            )}
          </div>
        </div>
      </div>

      <LessonExtras key={`extras-${lesson.id}`} lesson={lesson} variant={variant} />
    </div>
  );
}
