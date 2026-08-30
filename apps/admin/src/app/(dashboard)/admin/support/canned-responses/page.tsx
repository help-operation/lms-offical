import { listCannedResponsesAction } from "@/features/admin/actions/support.actions";
import { CannedResponsesClient } from "@/features/admin/CannedResponsesClient";
import type { CannedResponse } from "@/features/admin/api/support";
import Link from "next/link";

export const metadata = { title: "Canned Responses" };

export default async function CannedResponsesPage() {
  const res = await listCannedResponsesAction();
  const initial: CannedResponse[] = res.success ? res.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/support"
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← Support
        </Link>
        <span className="text-gray-200">/</span>
        <h1 className="text-2xl font-bold text-gray-900">Canned Responses</h1>
      </div>
      <p className="text-sm text-gray-500">
        Pre-written templates that agents can insert into replies with one click.
        Use the <strong>Manage templates</strong> link from the support page or the quote icon in the reply box.
      </p>
      <CannedResponsesClient initial={initial} />
    </div>
  );
}
