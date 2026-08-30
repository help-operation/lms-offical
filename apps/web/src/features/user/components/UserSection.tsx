import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { Button } from "@repo/ui/button";
import { User } from "lucide-react";
import Link from "next/link";
import { authApi } from "@/features/auth/api";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Admin",
  INSTRUCTOR:  "Instructor",
  STUDENT:     "Student",
  GUEST:       "Guest",
};

const ROLE_DASHBOARD: Record<string, string> = {
  SUPER_ADMIN: "/admin",
  INSTRUCTOR:  "/admin",
  STUDENT:     "/student/dashboard",
  GUEST:       "/guest/dashboard",
};

// Web app is for STUDENT and GUEST only — treat any other role as unauthenticated
const WEB_ROLES = new Set(["STUDENT", "GUEST"]);

type Props = {
  /** Compact avatar/person-icon only — no name/role text or "Log in" pill. */
  iconOnly?: boolean;
  /** Pair the "Login" link with a "Join Now" signup button (logged-out, non-iconOnly only). */
  showJoinNow?: boolean;
};

export async function UserSection({ iconOnly = false, showJoinNow = false }: Props = {}) {
  const res  = await authApi.me().catch(() => null);
  const user = res && WEB_ROLES.has(res.data.role) ? res : null;

  if (user) {
    const initials      = `${user.data.firstName[0] ?? ""}${user.data.lastName[0] ?? ""}`.toUpperCase();
    const dashboardHref = ROLE_DASHBOARD[user.data.role] ?? "/student/dashboard";
    const roleLabel     = ROLE_LABELS[user.data.role]    ?? user.data.role;

    if (iconOnly) {
      return (
        <Link href={dashboardHref} aria-label="Your account" className="shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.data.avatar ?? ""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Link>
      );
    }

    return (
      <Button asChild variant="ghost" className="h-auto gap-2.5 rounded-full px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/10">
        <Link href={dashboardHref}>
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={user.data.avatar ?? ""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden text-left leading-tight lg:block">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{`${user.data.firstName} ${user.data.lastName}`.trim()}</p>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
          </div>
        </Link>
      </Button>
    );
  }

  if (iconOnly) {
    return (
      <Link href="/login" aria-label="Sign in" className="text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
        <User className="h-5 w-5" />
      </Link>
    );
  }

  if (showJoinNow) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/login"
          aria-label="Sign in"
          className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-brand-solid transition-colors"
        >
          Login
        </Link>
        <Link
          href="/signup"
          className="rounded-md bg-gradient-to-r from-brand-from to-brand-to px-5 py-2 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
        >
          Join Now
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-3">
        <Link
          href="/login"
          aria-label="Sign in"
          className="py-2 w-32 px-4 flex justify-center items-center rounded-md text-base font-medium text-center text-white bg-brand-solid hover:bg-brand-hover transition-all shadow-md"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
