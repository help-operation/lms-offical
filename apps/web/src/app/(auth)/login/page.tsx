import { AuthShell } from "@/features/auth/AuthShell";
import { getPublicPageSections } from "@/features/cms/api/page-sections";

export const metadata = { title: "Login" };

export default async function LoginPage() {
  const sections = await getPublicPageSections("login");
  const panel = sections.find((s) => s.type === "login_panel");
  const title = (panel?.content?.title as string) || "Login to Your Account";
  const image =
    (panel?.content?.image as string) ||
    "https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?w=800&h=1000&fit=crop";

  return <AuthShell mode="page" initialTab="login" image={image} title={title} />;
}
