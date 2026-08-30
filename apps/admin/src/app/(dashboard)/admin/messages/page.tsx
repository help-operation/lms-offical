import { getContactMessagesAction } from "@/features/contact-messages/actions";
import { ContactMessagesManager } from "@/features/contact-messages/ContactMessagesManager";
import type { ContactMessagesResponse } from "@/features/contact-messages/types";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const res = await getContactMessagesAction({ page: 1, per_page: 20 });

  const initial: ContactMessagesResponse = res.success
    ? res.data
    : {
        data: [],
        pagination: { total: 0, per_page: 20, current_page: 1, last_page: 1, from: 0, to: 0 },
        unreadCount: 0,
      };

  return <ContactMessagesManager initial={initial} />;
}
