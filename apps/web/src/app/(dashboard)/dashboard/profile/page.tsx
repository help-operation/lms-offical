import { redirect } from "next/navigation";

// Profile management has moved to the dedicated student profile page.
export default function ProfilePage() {
  redirect("/student/profile");
}
