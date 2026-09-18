"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { OrderStatus } from "@/lib/constants";

export function StatusActionButton({
  orderNumber,
  targetStatus,
  label,
  variant = "primary",
}: {
  orderNumber: number;
  targetStatus: OrderStatus;
  label: string;
  variant?: "primary" | "secondary";
}) {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/orders/${orderNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update status");
      }
    },
    onSuccess: () => {
      toast.success(label);
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const className =
    variant === "primary"
      ? "rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      : "rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900";

  return (
    <button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending} className={className}>
      {mutation.isPending ? "Updating…" : label}
    </button>
  );
}
