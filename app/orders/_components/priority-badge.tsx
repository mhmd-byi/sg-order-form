import type { OrderPriority } from "@/lib/priority";

const PRIORITY_STYLES: Record<OrderPriority, string> = {
  Normal: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  High: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  Urgent: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export function PriorityBadge({ priority }: { priority: OrderPriority }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[priority]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {priority}
    </span>
  );
}
