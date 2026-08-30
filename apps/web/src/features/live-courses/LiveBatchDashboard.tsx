"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Video,
  FileDown,
  ClipboardList,
  CheckCircle2,
  Clock,
  Megaphone,
  MessageCircle,
  PlayCircle,
  ExternalLink,
  Loader2,
  BookOpen,
} from "lucide-react";
import type { BatchDashboard, BatchAssignment, BatchSession } from "./api/batch";
import { liveBatchApiBrowser } from "./api/batch-browser";

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Date-only (YYYY-MM-DD) → "Jun 10, 2025"; passes through legacy free-text. */
function fmtDay(v: string | null) {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(v);
  return isNaN(d.getTime())
    ? v
    : d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_STYLE: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  live: "bg-red-100 text-red-700",
  completed: "bg-slate-100 text-slate-600",
  cancelled: "bg-amber-100 text-amber-700",
};

export function LiveBatchDashboard({ data, slug }: { data: BatchDashboard; slug: string }) {
  const { course, batch, sessions, resources, assignments, attendanceCount } = data;

  return (
      <div className="space-y-8">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-r from-brand-from to-brand-to p-6 text-white shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-white/70">Live Course</p>
          <h1 className="mt-1 text-2xl font-bold">{course.title}</h1>
          {batch && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full bg-white/20 px-3 py-1 font-semibold">{batch.batchName}</span>
              <span className="rounded-full bg-white/15 px-3 py-1 capitalize">{batch.status}</span>
              {batch.startDate && (
                <span className="inline-flex items-center gap-1.5 text-white/90">
                  <Calendar className="h-4 w-4" /> Starts {fmtDay(batch.startDate)}
                </span>
              )}
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {course.hasContent ? (
              <Link
                href={`/c/${course.id}/learn`}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-white/90 transition-colors"
              >
                <BookOpen className="h-4 w-4" /> Course Content
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-medium text-white/80">
                <BookOpen className="h-4 w-4" /> Content coming soon
              </span>
            )}
            {course.supportWhatsapp && (
              <a
                href={`https://wa.me/${course.supportWhatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25 transition-colors"
              >
                <MessageCircle className="h-4 w-4" /> Support
              </a>
            )}
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat icon={<Video className="h-5 w-5" />} label="Sessions" value={sessions.length} accent="text-green-600 bg-green-50" />
          <Stat icon={<CheckCircle2 className="h-5 w-5" />} label="Attended" value={attendanceCount} accent="text-brand-solid bg-brand-50" />
          <Stat icon={<ClipboardList className="h-5 w-5" />} label="Assignments" value={assignments.length} accent="text-indigo-600 bg-indigo-50" />
          <Stat icon={<FileDown className="h-5 w-5" />} label="Resources" value={resources.length} accent="text-amber-600 bg-amber-50" />
        </div>

        {/* Class schedule / support */}
        {batch && (batch.schedule || batch.supportSchedule) && (
          <div className="grid sm:grid-cols-2 gap-4">
            {batch.schedule && (
              <InfoCard icon={<Clock className="h-4 w-4" />} title="Class Schedule" text={batch.schedule} />
            )}
            {batch.supportSchedule && (
              <InfoCard icon={<MessageCircle className="h-4 w-4" />} title="Support Hours" text={batch.supportSchedule} />
            )}
          </div>
        )}

        {/* Announcements */}
        {batch?.notes && (
          <Section title="Announcements" icon={<Megaphone className="h-5 w-5 text-amber-500" />}>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800 whitespace-pre-wrap dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              {batch.notes}
            </div>
          </Section>
        )}

        {/* Sessions */}
        <Section title="Live Classes & Recordings" icon={<Video className="h-5 w-5 text-green-600" />}>
          {sessions.length === 0 ? (
            <Empty text="Your class schedule will appear here once the batch begins." />
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <SessionRow key={s.id} session={s} />
              ))}
            </div>
          )}
        </Section>

        {/* Resources */}
        {resources.length > 0 && (
          <Section title="Resources" icon={<FileDown className="h-5 w-5 text-amber-600" />}>
            <div className="grid sm:grid-cols-2 gap-3">
              {resources.map((r) => (
                <a
                  key={r.id}
                  href={r.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-brand-300 hover:shadow-sm transition-all dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500/40"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                    <FileDown className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{r.title}</p>
                    <p className="text-xs text-slate-400 dark:text-gray-500">{r.fileType ?? "Download"}</p>
                  </div>
                </a>
              ))}
            </div>
          </Section>
        )}

        {/* Assignments */}
        <Section title="Assignments" icon={<ClipboardList className="h-5 w-5 text-indigo-600" />}>
          {assignments.length === 0 ? (
            <Empty text="No assignments yet." />
          ) : (
            <div className="space-y-4">
              {assignments.map((a) => (
                <AssignmentCard key={a.id} assignment={a} />
              ))}
            </div>
          )}
        </Section>

      </div>
  );
}

// ─── Session row (with Join / recording) ───────────────────────────────────────

function SessionRow({ session }: { session: BatchSession }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  const canJoin =
    (session.status === "scheduled" || session.status === "live") && session.meetingUrl;

  function handleJoin() {
    setError("");
    start(async () => {
      try {
        const res = await liveBatchApiBrowser.joinSession(session.id);
        window.open(res.data.meetingUrl, "_blank", "noopener");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not join");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">
        {session.status === "live" ? <PlayCircle className="h-5 w-5" /> : <Video className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{session.title}</p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLE[session.status]}`}>
            {session.status}
          </span>
          {session.attended && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-600">
              <CheckCircle2 className="h-3 w-3" /> Attended
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-slate-400 dark:text-gray-500">{fmtDate(session.scheduledAt)} · {session.durationMinutes} min</p>
        {error && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}
      </div>
      {canJoin ? (
        <button
          onClick={handleJoin}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
          Join Class
        </button>
      ) : session.recordingUrl ? (
        <a
          href={session.recordingUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-solid px-4 py-2 text-xs font-semibold text-white hover:bg-brand-hover transition-colors"
        >
          <PlayCircle className="h-3.5 w-3.5" /> Recording
        </a>
      ) : (
        <span className="text-xs text-slate-300 dark:text-gray-600">—</span>
      )}
    </div>
  );
}

// ─── Assignment card (with submit form) ─────────────────────────────────────────

function AssignmentCard({ assignment }: { assignment: BatchAssignment }) {
  const router = useRouter();
  const sub = assignment.mySubmission;
  const [url, setUrl] = useState(sub?.submissionUrl ?? "");
  const [text, setText] = useState(sub?.submissionText ?? "");
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit() {
    setError("");
    if (!url.trim() && !text.trim()) {
      setError("Add a link or some text");
      return;
    }
    start(async () => {
      try {
        await liveBatchApiBrowser.submitAssignment(assignment.id, {
          submissionUrl: url.trim() || undefined,
          submissionText: text.trim() || undefined,
        });
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Submission failed");
      }
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{assignment.title}</p>
          {assignment.description && (
            <p className="mt-1 text-xs text-slate-500 whitespace-pre-wrap dark:text-gray-400">{assignment.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400 dark:text-gray-500">
            {assignment.dueDate && <span>Due {fmtDate(assignment.dueDate)}</span>}
            <span>Max score: {assignment.maxScore}</span>
            {assignment.instructionsUrl && (
              <a href={assignment.instructionsUrl} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline dark:text-brand-400">
                Instructions
              </a>
            )}
          </div>
        </div>
        {/* Status pill */}
        {sub ? (
          sub.status === "graded" ? (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              Graded: {sub.score}/{assignment.maxScore}
            </span>
          ) : (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Submitted</span>
          )
        ) : (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Pending</span>
        )}
      </div>

      {/* Graded feedback */}
      {sub?.status === "graded" && sub.feedback && (
        <div className="mt-3 rounded-lg bg-green-50 p-3 text-xs text-green-800 dark:bg-green-500/10 dark:text-green-300">
          <span className="font-semibold">Feedback: </span>
          {sub.feedback}
        </div>
      )}

      {/* Submit / resubmit */}
      <div className="mt-3">
        {!open ? (
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {sub ? "Update submission" : "Submit assignment"}
          </button>
        ) : (
          <div className="space-y-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Submission link (Drive, GitHub, …)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Or write your answer / notes here"
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
            {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-solid px-4 py-2 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-60 transition-colors"
              >
                {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Submit
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Small presentational helpers ───────────────────────────────────────────────

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-500 dark:text-gray-400">{label}</p>
        <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">{icon} {title}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{text}</p>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
        {icon} {title}
      </h2>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500">
      {text}
    </div>
  );
}
