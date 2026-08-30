import { getEmailTemplatesAction } from "@/features/email-templates/actions";
import { EmailTemplatesClient } from "@/features/email-templates/EmailTemplatesClient";

export const metadata = { title: "Email Templates" };

export default async function EmailTemplatesPage() {
  const res = await getEmailTemplatesAction();
  const templates = res.success ? res.data : [];
  return <EmailTemplatesClient initial={templates} />;
}
