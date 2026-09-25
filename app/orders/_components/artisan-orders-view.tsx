"use client";

import { useState } from "react";
import Link from "next/link";
import type { OrderView } from "@/lib/types";
import { StatusBadge } from "./status-badge";

export function ArtisanOrdersView({ orders }: { orders: OrderView[] }) {
  const [tab, setTab] = useState<"current" | "past">("current");

  const currentOrders = orders.filter((o) => o.status === "InProgress");
  const pastOrders = orders.filter((o) => o.status === "Ready" || o.status === "Delivered");
  const visibleOrders = tab === "current" ? currentOrders : pastOrders;

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(
          [
            ["current", `Current (${currentOrders.length})`],
            ["past", `Past (${pastOrders.length})`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === value
                ? "bg-brand text-brand-foreground"
                : "border border-zinc-300 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">Order #</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">Order Date</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">Delivery Date</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">Status</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400"></th>
            </tr>
          </thead>
          <tbody>
            {visibleOrders.map((order) => (
              <tr key={order.orderNumber} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-3 font-medium">SG-{order.orderNumber}</td>
                <td className="px-4 py-3">
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3">
                  {new Date(order.deliveryDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/orders/${order.orderNumber}/docket`} className="text-brand hover:underline">
                    View docket
                  </Link>
                </td>
              </tr>
            ))}
            {visibleOrders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  {tab === "current" ? "No current orders." : "No past orders."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
