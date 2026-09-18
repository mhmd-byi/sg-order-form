"use client";

import { useState } from "react";
import type { OrderView } from "@/lib/types";
import { OrdersTable } from "./orders-table";
import { KanbanBoard } from "./kanban-board";

export function OrdersView({ orders }: { orders: OrderView[] }) {
  const [view, setView] = useState<"table" | "board">("table");

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["table", "board"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${
              view === v
                ? "bg-brand text-brand-foreground"
                : "border border-zinc-300 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      {view === "table" ? <OrdersTable orders={orders} /> : <KanbanBoard initialOrders={orders} />}
    </div>
  );
}
