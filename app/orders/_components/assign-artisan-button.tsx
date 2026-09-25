"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const inputClass =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-zinc-700 dark:bg-zinc-900";

export function AssignArtisanButton({
  orderNumber,
  artisans,
  currentArtisanId,
}: {
  orderNumber: number;
  artisans: { id: string; name: string }[];
  currentArtisanId?: string;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [artisanId, setArtisanId] = useState(currentArtisanId ?? "");
  const isReassign = !!currentArtisanId;

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/orders/${orderNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedArtisan: artisanId }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to assign artisan");
      }
    },
    onSuccess: () => {
      toast.success(isReassign ? "Artisan changed" : "Order assigned");
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
      >
        {isReassign ? "Change artisan" : "Assign to artisan"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-zinc-300 p-3 dark:border-zinc-700">
      <select value={artisanId} onChange={(e) => setArtisanId(e.target.value)} className={inputClass}>
        <option value="">Select an artisan</option>
        {artisans.map((artisan) => (
          <option key={artisan.id} value={artisan.id}>
            {artisan.name}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !artisanId || artisanId === currentArtisanId}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {mutation.isPending ? "Saving…" : isReassign ? "Confirm change" : "Confirm assign"}
        </button>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
