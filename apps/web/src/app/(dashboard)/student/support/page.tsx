import { supportApi } from "@/features/support/api";
import { SupportTicketsClient } from "@/features/support/SupportTicketsClient";

export const metadata = { title: "Support" };

export default async function StudentSupportPage() {
  const res = await supportApi.myTickets().catch(() => null);
  const tickets = res?.data ?? [];

  return <SupportTicketsClient initialTickets={tickets} />;
}
