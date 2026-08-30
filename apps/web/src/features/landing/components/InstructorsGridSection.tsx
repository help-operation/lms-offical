import { InstructorsGridV2, type InstructorsGridContent } from "@repo/ui/home-v1-instructors-grid";
import { getPublicInstructors } from "@/features/cms/api/instructors";

export type { InstructorsGridContent };

type Props = { content?: InstructorsGridContent };

export default async function InstructorsGridSection({ content = {} }: Props) {
  const instructors = await getPublicInstructors();
  const items = instructors.map((inst) => ({
    id: inst.id,
    name: `${inst.firstName ?? ""} ${inst.lastName ?? ""}`.trim(),
    avatar: inst.avatar,
    expertise: inst.expertise,
  }));

  return <InstructorsGridV2 content={content} instructors={items} />;
}
