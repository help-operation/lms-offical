"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import {
  lessonsApiBrowser,
  type QuizTake,
  type QuizResult,
} from "@/features/learn/api/lessons/browser";
import { liveLessonAssessmentsApiBrowser } from "@/features/live-courses/api/browser";

export function QuizRunner({
  lessonId,
  variant = "recorded",
}: {
  lessonId: number;
  variant?: "recorded" | "live";
}) {
  const api = variant === "live" ? liveLessonAssessmentsApiBrowser : lessonsApiBrowser;
  const [quiz, setQuiz] = useState<QuizTake | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<number, Set<number>>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .getQuiz(lessonId)
      .then((res) => setQuiz(res.data))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load quiz"))
      .finally(() => setLoading(false));
  }, [api, lessonId]);

  function pick(q: QuizTake["questions"][number], answerId: number) {
    setSelected((prev) => {
      const cur = new Set(prev[q.id] ?? []);
      if (q.type === "single") {
        return { ...prev, [q.id]: new Set([answerId]) };
      }
      if (cur.has(answerId)) cur.delete(answerId);
      else cur.add(answerId);
      return { ...prev, [q.id]: cur };
    });
  }

  async function submit() {
    if (!quiz) return;
    setSubmitting(true);
    setError(null);
    try {
      const answers = quiz.questions.map((q) => ({
        questionId: q.id,
        answerIds: [...(selected[q.id] ?? [])],
      }));
      const res = await api.submitQuiz(quiz.id, answers);
      setResult(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 dark:text-gray-500 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading quiz…
      </div>
    );
  }

  if (error && !quiz) {
    return <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</div>;
  }

  if (!quiz) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-10 text-center text-gray-400 dark:bg-white/5 dark:border-white/10 dark:text-gray-500">
        No quiz has been set up for this lesson yet.
      </div>
    );
  }

  if (result) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center dark:bg-[#121217] dark:border-white/10">
        {result.passed ? (
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
        ) : (
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        )}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          {result.passed ? "Passed!" : "Not passed"}
        </h3>
        <p className="text-gray-600 mt-1 dark:text-gray-300">
          Score: {result.score}% ({result.correctCount}/{result.totalQuestions} correct)
        </p>
        <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">Passing score: {result.passingScore}%</p>
        <button
          onClick={() => { setResult(null); setSelected({}); }}
          className="mt-5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl"
        >
          Retry Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900 dark:text-white">{quiz.title}</h2>
        <span className="text-xs text-gray-400 dark:text-gray-500">Pass: {quiz.passingScore}%</span>
      </div>

      {quiz.lastAttempt && (
        <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 dark:text-gray-400 dark:bg-white/5 dark:border-white/10">
          Last attempt: {Math.round(Number(quiz.lastAttempt.score))}% —{" "}
          {quiz.lastAttempt.passed ? "Passed" : "Not passed"}
        </div>
      )}

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</div>}

      {quiz.questions.map((q, i) => (
        <div key={q.id} className="bg-white border border-gray-200 rounded-2xl p-5 dark:bg-[#121217] dark:border-white/10">
          <p className="font-medium text-gray-900 mb-1 dark:text-white">
            {i + 1}. {q.question}
          </p>
          <p className="text-xs text-gray-400 mb-3 dark:text-gray-500">
            {q.type === "multiple" ? "Select all that apply" : "Select one"}
          </p>
          <div className="space-y-2">
            {q.answers.map((a) => {
              const checked = selected[q.id]?.has(a.id) ?? false;
              return (
                <label
                  key={a.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl border cursor-pointer transition-colors ${
                    checked
                      ? "border-indigo-400 bg-indigo-50 dark:border-brand-500 dark:bg-brand-500/10"
                      : "border-gray-200 hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
                  }`}
                >
                  <input
                    type={q.type === "single" ? "radio" : "checkbox"}
                    name={`q-${q.id}`}
                    checked={checked}
                    onChange={() => pick(q, a.id)}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{a.answer}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      <button
        onClick={submit}
        disabled={submitting || quiz.questions.length === 0}
        className="bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white text-sm font-medium px-6 py-2.5 rounded-xl"
      >
        {submitting ? "Submitting…" : "Submit Quiz"}
      </button>
    </div>
  );
}
