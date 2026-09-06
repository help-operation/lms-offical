import { notFound } from "next/navigation";
import Link from "next/link";
import { adminApi } from "@/features/admin/api";
import { UserDetailClient } from "@/features/admin/UserDetailClient";

export const metadata = { title: "User Profile" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params;
  const numericId = parseInt(id);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center">
          <svg className="h-8 w-8 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">User Not Found</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 text-center max-w-md">
          The user you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/admin/users"
          className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 dark:bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 dark:hover:bg-brand-hover transition-colors"
        >
          Back to Users
        </Link>
      </div>
    );
  }

  try {
    const res = await adminApi.getUser(numericId);
    if (!res?.data) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center">
            <svg className="h-8 w-8 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">User Not Found</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 text-center max-w-md">
            The user with ID #{numericId} was not found.
          </p>
          <Link
            href="/admin/users"
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 dark:bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 dark:hover:bg-brand-hover transition-colors"
          >
            Back to Users
          </Link>
        </div>
      );
    }

    return <UserDetailClient user={res.data} />;
  } catch {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-500/15 flex items-center justify-center">
          <svg className="h-8 w-8 text-yellow-500 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Unable to Load Profile</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 text-center max-w-md">
          Something went wrong while fetching the user profile. Please try again.
        </p>
        <Link
          href="/admin/users"
          className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 dark:bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 dark:hover:bg-brand-hover transition-colors"
        >
          Back to Users
        </Link>
      </div>
    );
  }
}
