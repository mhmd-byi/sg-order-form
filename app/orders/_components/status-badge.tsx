import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";

const STATUS_STYLES: Record<OrderStatus, string> = {
  Pending: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  InProgress: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Ready: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  Delivered: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
