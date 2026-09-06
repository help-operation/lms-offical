import { MessageSquare, BookOpen } from "lucide-react";
import { authApi } from "@/features/auth/api";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Messages" };

export default async function StudentMessagesPage() {
  const user = await authApi.me().catch(() => null);
  if (!user || user.data.role !== "STUDENT") redirect("/");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand dark:bg-brand-500/10">
          <MessageSquare className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Messages
        </h3>
        <p className="mt-2 max-w-md mx-auto text-sm text-slate-500 dark:text-slate-400">
          Communicate with your instructors and support team. Messages from your
          courses will appear here.
        </p>
        <Link
          href="/student/support"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
        >
          <BookOpen className="h-4 w-4" />
          Contact Support
        </Link>
      </div>
    </div>
  );
}
