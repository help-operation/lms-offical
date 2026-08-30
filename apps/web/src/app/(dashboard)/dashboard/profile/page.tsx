import { redirect } from "next/navigation";

// Profile management has moved into the unified Settings page.
export default function ProfilePage() {
  redirect("/dashboard/settings");
}
