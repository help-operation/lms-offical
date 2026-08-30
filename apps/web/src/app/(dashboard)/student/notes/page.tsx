import Link from "next/link";
import { NotebookPen } from "lucide-react";
import { notesApi } from "@/features/learn/api/notes";
import { NotesTable } from "@/features/learn/NotesTable";

export const metadata = { title: "My Notes" };

export default async function StudentNotesPage() {
  const res = await notesApi.listAll().catch(() => null);
  const notes = res?.data ?? [];

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <NotebookPen className="h-7 w-7 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="mb-1 text-base font-semibold text-slate-700 dark:text-slate-200">No notes yet</h3>
        <p className="mb-5 text-sm text-slate-400 dark:text-slate-500">
          Notes you jot down while learning will show up here.
        </p>
        <Link
          href="/student/courses"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-500"
        >
          Go to My Courses
        </Link>
      </div>
    );
  }

  return <NotesTable notes={notes} />;
}
