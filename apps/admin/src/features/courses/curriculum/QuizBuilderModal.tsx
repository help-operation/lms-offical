"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Plus, Trash2, Loader2, Check } from "lucide-react";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import {
  assessmentsBrowserApi,
  type AssessmentsBrowserApi,
  type Quiz,
  type QuizQuestion,
  type QuizQuestionType,
} from "@/features/courses/api/assessments/browser";

interface Props {
  lessonId: number;
  lessonTitle: string;
  onClose: () => void;
  /** Course-type assessments API (defaults to recorded). */
  api?: AssessmentsBrowserApi;
}

type AnswerDraft = { answer: string; isCorrect: boolean };

export function QuizBuilderModal({ lessonId, lessonTitle, onClose, api = assessmentsBrowserApi }: Props) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState(lessonTitle);
  const [passingScore, setPassingScore] = useState(70);

  const reload = useCallback(async () => {
    const res = await api.getQuiz(lessonId);
    setQuiz(res.data);
    return res.data;
  }, [api, lessonId]);

  useEffect(() => {
    reload()
      .then((q) => {
        if (q) {
          setTitle(q.title);
          setPassingScore(q.passingScore);
        }
      })
      .catch(() => setError("Failed to load quiz"))
      .finally(() => setLoading(false));
  }, [reload]);

  async function saveQuiz() {
    setBusy(true);
    setError(null);
    try {
      await api.upsertQuiz(lessonId, {
        title: title.trim(),
        passingScore,
      });
      await reload();
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
          <h2 className="font-bold text-gray-900">Quiz Builder</h2>
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
                  <label className="block text-sm font-medium text-gray-700">Quiz Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Passing Score (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                    className="w-32 text-sm border border-gray-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <button
                  onClick={saveQuiz}
                  disabled={busy || !title.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-xl"
                >
                  {quiz ? "Save Quiz Settings" : "Create Quiz"}
                </button>
              </div>

              {quiz && (
                <div className="space-y-4">
                  {quiz.questions.map((q, i) => (
                    <QuestionEditor
                      key={q.id}
                      index={i}
                      quizId={quiz.id}
                      question={q}
                      reload={reload}
                      onError={setError}
                      api={api}
                    />
                  ))}
                  <QuestionEditor quizId={quiz.id} reload={reload} onError={setError} api={api} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestionEditor({
  quizId,
  question,
  index,
  reload,
  onError,
  api,
}: {
  quizId: number;
  question?: QuizQuestion;
  index?: number;
  reload: () => Promise<Quiz | null>;
  onError: (m: string | null) => void;
  api: AssessmentsBrowserApi;
}) {
  const isEdit = !!question;
  const [open, setOpen] = useState(isEdit);
  const [text, setText] = useState(question?.question ?? "");
  const [type, setType] = useState<QuizQuestionType>(question?.type ?? "single");
  const [answers, setAnswers] = useState<AnswerDraft[]>(
    question?.answers.map((a) => ({ answer: a.answer, isCorrect: a.isCorrect })) ?? [
      { answer: "", isCorrect: true },
      { answer: "", isCorrect: false },
    ],
  );
  const [busy, setBusy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function setAnswer(i: number, patch: Partial<AnswerDraft>) {
    setAnswers((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }

  function toggleCorrect(i: number) {
    setAnswers((prev) =>
      prev.map((a, idx) => {
        if (type === "single") return { ...a, isCorrect: idx === i };
        return idx === i ? { ...a, isCorrect: !a.isCorrect } : a;
      }),
    );
  }

  async function save() {
    onError(null);
    const cleaned = answers.filter((a) => a.answer.trim());
    if (text.trim().length < 2 || cleaned.length < 2 || !cleaned.some((a) => a.isCorrect)) {
      onError("Question needs text, 2+ answers, and a correct answer.");
      return;
    }
    setBusy(true);
    try {
      const payload = { question: text.trim(), type, answers: cleaned };
      if (question) {
        await api.updateQuestion(question.id, payload);
      } else {
        await api.addQuestion(quizId, payload);
      }
      await reload();
      if (!isEdit) {
        setText("");
        setAnswers([
          { answer: "", isCorrect: true },
          { answer: "", isCorrect: false },
        ]);
        setOpen(false);
      }
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to save question");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!question) return;
    setShowDeleteConfirm(false);
    setBusy(true);
    onError(null);
    try {
      await api.deleteQuestion(question.id);
      await reload();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setBusy(false);
    }
  }

  if (!isEdit && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        <Plus className="h-4 w-4" /> Add Question
      </button>
    );
  }

  return (
    <>
    <ConfirmModal
      open={showDeleteConfirm}
      title="Delete Question"
      message={<>Delete question <strong>#{(index ?? 0) + 1}</strong>? This cannot be undone.</>}
      confirmLabel="Yes, Delete"
      variant="danger"
      isPending={busy}
      onConfirm={remove}
      onClose={() => setShowDeleteConfirm(false)}
    />
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400">
          {isEdit ? `Question ${(index ?? 0) + 1}` : "New Question"}
        </span>
        {isEdit && (
          <button onClick={() => setShowDeleteConfirm(true)} disabled={busy} className="text-gray-300 hover:text-red-500">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="Question text"
        className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as QuizQuestionType)}
        className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 outline-none"
      >
        <option value="single">Single choice</option>
        <option value="multiple">Multiple choice</option>
      </select>

      <div className="space-y-2">
        {answers.map((a, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleCorrect(i)}
              title="Mark correct"
              className={`flex-shrink-0 h-6 w-6 rounded-md border flex items-center justify-center ${
                a.isCorrect ? "bg-green-500 border-green-500 text-white" : "border-gray-300 text-transparent"
              }`}
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <input
              value={a.answer}
              onChange={(e) => setAnswer(i, { answer: e.target.value })}
              placeholder={`Answer ${i + 1}`}
              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {answers.length > 2 && (
              <button
                type="button"
                onClick={() => setAnswers((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-gray-300 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        {answers.length < 8 && (
          <button
            type="button"
            onClick={() => setAnswers((prev) => [...prev, { answer: "", isCorrect: false }])}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Add answer
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={busy}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-medium px-4 py-2 rounded-lg"
        >
          {busy ? "Saving…" : isEdit ? "Update" : "Add Question"}
        </button>
        {!isEdit && (
          <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">
            Cancel
          </button>
        )}
      </div>
    </div>
    </>
  );
}
