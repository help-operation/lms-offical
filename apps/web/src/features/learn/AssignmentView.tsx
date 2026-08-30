"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import {
  lessonsApiBrowser,
  type AssignmentView as AssignmentData,
} from "@/features/learn/api/lessons/browser";
import { liveLessonAssessmentsApiBrowser } from "@/features/live-courses/api/browser";

function existingUrls(sub: AssignmentData["submission"]): string[] {
  if (!sub) return [];
  if (sub.fileUrls?.length) return sub.fileUrls;
  return sub.fileUrl ? [sub.fileUrl] : [];
}

export function AssignmentView({
  lessonId,
  variant = "recorded",
  onSubmitted,
}: {
  lessonId: number;
  variant?: "recorded" | "live";
  /** Fired once a submission exists (on load or right after submitting) — lets the
   *  parent lesson viewer unlock "Next" for assignment lessons that require it. */
  onSubmitted?: () => void;
}) {
  const api = variant === "live" ? liveLessonAssessmentsApiBrowser : lessonsApiBrowser;
  const [data, setData] = useState<AssignmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [fileUrls, setFileUrls] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .getAssignment(lessonId)
      .then((res) => {
        setData(res.data);
        const mf = Math.max(res.data?.maxFiles ?? 1, 1);
        if (res.data?.submission) {
          setContent(res.data.submission.content ?? "");
          const urls = existingUrls(res.data.submission);
          setFileUrls(urls.length ? urls : Array(mf).fill(""));
          onSubmitted?.();
        } else {
          setFileUrls(Array(mf).fill(""));
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, lessonId]);

  const maxFiles = data?.maxFiles ?? 1;
  const filesRequired = data?.filesRequired ?? false;
  const trimmedContent = content.trim();
  const trimmedUrls = fileUrls.map((u) => u.trim()).filter(Boolean);
  const missingRequired = filesRequired && (!trimmedContent || trimmedUrls.length === 0);

  function updateUrl(index: number, value: string) {
    setFileUrls((prev) => prev.map((u, i) => (i === index ? value : u)));
  }

  function addUrlSlot() {
    setFileUrls((prev) => (prev.length < maxFiles ? [...prev, ""] : prev));
  }

  function removeUrlSlot(index: number) {
    setFileUrls((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : [""]));
  }

  async function submit() {
    if (!data) return;
    if (!trimmedContent && trimmedUrls.length === 0) {
      setError("Provide submission text or a file URL");
      return;
    }
    if (filesRequired && !trimmedContent) {
      setError("This assignment requires submission text");
      return;
    }
    if (filesRequired && trimmedUrls.length === 0) {
      setError("This assignment requires at least one file");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.submitAssignment(data.id, {
        content: trimmedContent || undefined,
        fileUrls: trimmedUrls.length ? trimmedUrls : undefined,
      });
      setData({ ...data, submission: res.data });
      onSubmitted?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 dark:text-gray-500 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-10 text-center text-gray-400 dark:bg-white/5 dark:border-white/10 dark:text-gray-500">
        No assignment has been set up for this lesson yet.
      </div>
    );
  }

  const sub = data.submission;
  const graded = sub?.status === "graded";

  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 dark:bg-[#121217] dark:border-white/10">
        <h2 className="font-bold text-gray-900 dark:text-white">{data.title}</h2>
        {data.dueDate && (
          <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">
            Due: {new Date(data.dueDate).toLocaleString()}
          </p>
        )}
        {data.description && (
          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words mt-3 dark:text-gray-300">
            {data.description}
          </p>
        )}
      </div>

      {graded && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 dark:bg-green-500/10 dark:border-green-500/20">
          <p className="text-sm font-semibold text-green-800 dark:text-green-300">
            Graded: {sub!.grade}/100
          </p>
          {sub!.feedback && (
            <p className="text-sm text-green-700 mt-1 whitespace-pre-wrap dark:text-green-400">{sub!.feedback}</p>
          )}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 dark:bg-[#121217] dark:border-white/10">
        <h3 className="flex items-center gap-1.5 font-semibold text-gray-900 text-sm dark:text-white">
          {sub ? "Your Submission" : "Submit Your Work"}
          {filesRequired && !sub && (
            <span className="text-xs font-medium text-red-500 dark:text-red-400">*Required</span>
          )}
        </h3>
        {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</div>}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          placeholder={filesRequired ? "Type your submission here… (required)" : "Type your submission here…"}
          className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-400 resize-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-brand-500"
        />
        {maxFiles > 0 && (
          <div className="space-y-2">
            {fileUrls.map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => updateUrl(i, e.target.value)}
                  placeholder={`Paste a file/link URL${filesRequired && i === 0 ? " (required)" : " (Google Drive, GitHub, etc.)"}`}
                  className="flex-1 text-sm border border-gray-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-brand-500"
                />
                {fileUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeUrlSlot(i)}
                    className="shrink-0 p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {fileUrls.length < maxFiles && (
              <button
                type="button"
                onClick={addUrlSlot}
                className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
              >
                <Plus className="h-3.5 w-3.5" /> Add another link ({fileUrls.length}/{maxFiles})
              </button>
            )}
          </div>
        )}
        <button
          onClick={submit}
          disabled={submitting || missingRequired}
          className="bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white text-sm font-medium px-6 py-2.5 rounded-xl"
        >
          {submitting ? "Submitting…" : sub ? "Resubmit" : "Submit"}
        </button>
        {missingRequired && !submitting && (
          <p className="text-xs text-red-500 dark:text-red-400">
            {!trimmedContent ? "Submission text is required." : "At least one file/link is required."}
          </p>
        )}
        {sub && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Submitted {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : ""}
            {" — "}status: {sub.status}
          </p>
        )}
      </div>
    </div>
  );
}
