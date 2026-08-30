import { TablePageSkeleton } from "@/shared/components/TablePageSkeleton";

export default function Loading() {
  return <TablePageSkeleton columns={4} filters={1} />;
}
