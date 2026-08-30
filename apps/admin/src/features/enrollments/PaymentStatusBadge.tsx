const STYLES: Record<"due" | "partial" | "paid", string> = {
  due: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  partial: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  paid: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
};

const LABELS: Record<"due" | "partial" | "paid", string> = {
  due: "Due",
  partial: "Partial",
  paid: "Paid",
};

export function PaymentStatusBadge({ status }: { status: "due" | "partial" | "paid" }) {
  return (
    <span className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
