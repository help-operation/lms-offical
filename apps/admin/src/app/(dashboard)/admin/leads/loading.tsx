import { TablePageSkeleton } from "@/shared/components/TablePageSkeleton";

export default function Loading() {
  return <TablePageSkeleton columns={6} filters={2} />;
}
