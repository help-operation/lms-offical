"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import {
  assessmentsBrowserApi,
  type AssessmentsBrowserApi,
  type Assignment,
  type AssignmentSubmission,
} from "@/features/courses/api/assessments/browser";

interface Props {
  lessonId: number;
  lessonTitle: string;
  onClose: () => void;
  /** Course-type assessments API (defaults to recorded). */
  api?: AssessmentsBrowserApi;
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function AssignmentBuilderModal({ lessonId, lessonTitle, onClose, api = assessmentsBrowserApi }: Props) {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState(lessonTitle);
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxFiles, setMaxFiles] = useState(1);
  const [filesRequired, setFilesRequired] = useState(false);

  const loadSubmissions = useCallback(async (assignmentId: number) => {
    const res = await api.listSubmissions(assignmentId);
    setSubmissions(res.data);
  }, [api]);

  useEffect(() => {
    api
      .getAssignment(lessonId)
      .then(async (res) => {
        if (res.data) {
          setAssignment(res.data);
          setTitle(res.data.title);
          setDescription(res.data.description ?? "");
          setDueDate(toLocalInput(res.data.dueDate));
          setMaxFiles(res.data.maxFiles ?? 1);
          setFilesRequired(res.data.filesRequired ?? false);
          await loadSubmissions(res.data.id);
        }
      })
      .catch(() => setError("Failed to load assignment"))
      .finally(() => setLoading(false));
  }, [api, lessonId, loadSubmissions]);

  async function saveAssignment() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.upsertAssignment(lessonId, {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        maxFiles,
        filesRequired,
      });
      setAssignment(res.data);
      await loadSubmissions(res.data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-gray-50 rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl">
          <h2 className="font-bold text-gray-900">Assignment Builder</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Instructions</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="text-sm border border-gray-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Max Files</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={maxFiles}
                      onChange={(e) => {
                        const v = Math.min(10, Math.max(0, parseInt(e.target.value) || 0));
                        setMaxFiles(v);
                        if (v === 0) setFilesRequired(false);
                      }}
                      className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <p className="text-xs text-gray-400">How many file/link slots the student gets. 0 = text only.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Required</label>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={filesRequired}
                      onClick={() => setFilesRequired((v) => !v)}
                      disabled={maxFiles === 0}
                      className="w-full flex items-center justify-between gap-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-xl px-3.5 py-2.5 h-[42px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="font-medium truncate">Text + file required</span>
                      <span
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${filesRequired ? "bg-indigo-600" : "bg-gray-300"}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${filesRequired ? "translate-x-[18px]" : "translate-x-1"}`} />
                      </span>
                    </button>
                    <p className="text-xs text-gray-400">Student must fill in submission text and at least one file before submitting.</p>
                  </div>
                </div>
                <button
                  onClick={saveAssignment}
                  disabled={busy || !title.trim()}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {busy ? "Saving…" : assignment ? "Save Assignment" : "Create Assignment"}
                </button>
              </div>

              {assignment && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm">
                    Submissions ({submissions.length})
                  </h3>
                  {submissions.length === 0 ? (
                    <p className="text-sm text-gray-400">No submissions yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {submissions.map((s) => (
                        <SubmissionRow
                          key={s.id}
                          submission={s}
                          onGraded={() => loadSubmissions(assignment.id)}
                          onError={setError}
                          api={api}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SubmissionRow({
  submission,
  onGraded,
  onError,
  api,
}: {
  submission: AssignmentSubmission;
  onGraded: () => void;
  onError: (m: string | null) => void;
  api: AssessmentsBrowserApi;
}) {
  const [grade, setGrade] = useState(submission.grade ?? "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    const g = Number(grade);
    if (Number.isNaN(g) || g < 0 || g > 100) {
      onError("Grade must be between 0 and 100");
      return;
    }
    setBusy(true);
    onError(null);
    try {
      await api.gradeSubmission(submission.id, {
        grade: g,
        feedback: feedback.trim() || undefined,
      });
      onGraded();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to grade");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">
          {submission.firstName} {submission.lastName}
        </span>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            submission.status === "graded"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {submission.status}
        </span>
      </div>
      {submission.content && (
        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words bg-gray-50 rounded-lg p-3">
          {submission.content}
        </p>
      )}
      {(submission.fileUrls?.length ? submission.fileUrls : submission.fileUrl ? [submission.fileUrl] : []).map(
        (url) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="block text-xs text-indigo-600 hover:underline break-all"
          >
            {url}
          </a>
        ),
      )}
      <div className="flex items-end gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Grade (0–100)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-24 text-sm border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <input
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Feedback (optional)"
          className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={save}
          disabled={busy}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-medium px-4 py-2 rounded-lg"
        >
          {busy ? "…" : "Grade"}
        </button>
      </div>
    </div>
  );
}
