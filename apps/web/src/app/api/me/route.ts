import { NextResponse } from "next/server";
import { authApi } from "@/features/auth/api";

// Web app is for STUDENT and GUEST only — treat any other role as unauthenticated.
const WEB_ROLES = new Set(["STUDENT", "GUEST"]);
const ROLE_LABELS: Record<string, string> = { STUDENT: "Student", GUEST: "Guest" };
const ROLE_DASHBOARD: Record<string, string> = {
  STUDENT: "/student/dashboard",
  GUEST: "/guest/dashboard",
};

/**
 * Same-origin endpoint for the mobile drawer's auth state. Reading the auth
 * cookie here (a Route Handler) is always dynamic and never affects the
 * public pages' static shell — unlike reading it during page render.
 */
export async function GET() {
  const res = await authApi.me().catch(() => null);
  const u = res && WEB_ROLES.has(res.data.role) ? res.data : null;

  if (!u) return NextResponse.json({ user: null });

  return NextResponse.json({
    user: {
      name: `${u.firstName} ${u.lastName}`.trim(),
      roleLabel: ROLE_LABELS[u.role] ?? u.role,
      initials: `${u.firstName[0] ?? ""}${u.lastName[0] ?? ""}`.toUpperCase(),
      avatar: u.avatar ?? null,
      dashboardHref: ROLE_DASHBOARD[u.role] ?? "/student/dashboard",
    },
  });
}
