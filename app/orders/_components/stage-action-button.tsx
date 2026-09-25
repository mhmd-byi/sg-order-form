"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ArtisanStage } from "@/lib/constants";

export function StageActionButton({
  orderNumber,
  targetStage,
  label,
}: {
  orderNumber: number;
  targetStage: ArtisanStage;
  label: string;
}) {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/orders/${orderNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artisanStage: targetStage }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update stage");
      }
    },
    onSuccess: () => {
      toast.success(label);
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <button
      type="button"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {mutation.isPending ? "Updating…" : label}
    </button>
  );
}
