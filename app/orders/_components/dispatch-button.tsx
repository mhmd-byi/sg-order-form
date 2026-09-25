"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DISPATCH_METHODS, type DispatchMethod } from "@/lib/constants";

const inputClass =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-zinc-700 dark:bg-zinc-900";

export function DispatchButton({ orderNumber }: { orderNumber: number }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [method, setMethod] = useState<DispatchMethod>("Self");
  const [name, setName] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/orders/${orderNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artisanStage: "Dispatched",
          dispatchMethod: method,
          dispatchedByName: method === "Pickup" ? name : undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to dispatch");
      }
    },
    onSuccess: () => {
      toast.success("Dispatched to showroom");
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
        Dispatch to showroom
      </button>
    );
  }

  const canConfirm = method === "Self" || name.trim().length > 0;

  return (
    <div className="flex flex-col gap-2 rounded-md border border-zinc-300 p-3 dark:border-zinc-700">
      <p className="text-sm font-medium">Dispatched by</p>
      <div className="flex gap-4 text-sm">
        {DISPATCH_METHODS.map((m) => (
          <label key={m} className="flex items-center gap-1.5">
            <input type="radio" name="dispatchMethod" checked={method === m} onChange={() => setMethod(m)} />
            {m}
          </label>
        ))}
      </div>
      {method === "Pickup" && (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name of person picking up"
          className={inputClass}
        />
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !canConfirm}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {mutation.isPending ? "Dispatching…" : "Confirm dispatch"}
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
