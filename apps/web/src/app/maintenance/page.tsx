import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Under Maintenance" };

async function getMaintenanceMessage(): Promise<string> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
    const res = await fetch(
      `${apiUrl}/system-settings/public?keys=maintenance_message`,
      { next: { revalidate: 30, tags: ["maintenance"] } },
    );
    if (!res.ok) return "";
    const json = await res.json();
    return (json?.data?.maintenance_message as string | undefined)?.trim() ?? "";
  } catch {
    return "";
  }
}

async function MaintenanceMessage() {
  const raw = await getMaintenanceMessage();
  const message =
    raw || "We are currently performing scheduled maintenance. We'll be back shortly.";
  return (
    <p className="mt-4 text-base text-gray-500 leading-relaxed">{message}</p>
  );
}

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-indigo-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">

        {/* Icon */}
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-brand-100 shadow-inner">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-brand-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Under Maintenance
        </h1>

        <Suspense
          fallback={
            <p className="mt-4 text-base text-gray-500 leading-relaxed">
              We are currently performing scheduled maintenance. We&rsquo;ll be back shortly.
            </p>
          }
        >
          <MaintenanceMessage />
        </Suspense>

        <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-100 px-5 py-2 text-sm font-medium text-brand-700">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-600" />
          </span>
          We&rsquo;ll be back soon
        </div>

        <p className="mt-10 text-xs text-gray-400">
          If you have an urgent query, please contact our support team.
        </p>
      </div>
    </div>
  );
}
