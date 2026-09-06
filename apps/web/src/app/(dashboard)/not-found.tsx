import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="relative">
        <span className="text-7xl font-extrabold tracking-tight text-slate-200 dark:text-slate-700">
          404
        </span>
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-brand">
          ?
        </span>
      </div>
      <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
        Page not found
      </h2>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/student/dashboard"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-solid px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
