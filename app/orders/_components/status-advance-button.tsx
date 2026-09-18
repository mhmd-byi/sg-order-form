"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NEXT_STATUS, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";

export function StatusAdvanceButton({ orderNumber, status }: { orderNumber: number; status: OrderStatus }) {
  const router = useRouter();
  const nextStatus = NEXT_STATUS[status];

  const mutation = useMutation({
    mutationFn: async (next: OrderStatus) => {
      const response = await fetch(`/api/orders/${orderNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update status");
      }
    },
    onSuccess: () => {
      toast.success(`Order marked as ${ORDER_STATUS_LABELS[nextStatus as OrderStatus]}`);
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!nextStatus) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => mutation.mutate(nextStatus)}
      disabled={mutation.isPending}
      className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {mutation.isPending ? "Updating…" : `Mark as ${ORDER_STATUS_LABELS[nextStatus]}`}
    </button>
  );
}
