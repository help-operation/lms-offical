import { AuthShell } from "@/features/auth/AuthShell";
import { getPublicPageSections } from "@/features/cms/api/page-sections";

export const metadata = { title: "Login" };

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google: "Google login failed. Please try again or use email/password.",
  google_no_email: "Google account has no email address. Please use email/password login.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const sections = await getPublicPageSections("login");
  const panel = sections.find((s) => s.type === "login_panel");
  const title = (panel?.content?.title as string) || "Login to Your Account";
  const image =
    (panel?.content?.image as string) ||
    "https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?w=800&h=1000&fit=crop";

  const authError = error ? (GOOGLE_ERROR_MESSAGES[error] ?? "Something went wrong. Please try again.") : null;

  return <AuthShell mode="page" initialTab="login" image={image} title={title} authError={authError} />;
}
