"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/constants";
import { getOrderPriority } from "@/lib/priority";
import type { OrderView } from "@/lib/types";
import { PriorityBadge } from "./priority-badge";

async function fetchOrders(): Promise<OrderView[]> {
  const response = await fetch("/api/orders");
  if (!response.ok) throw new Error("Failed to load orders");
  const data = await response.json();
  return data.orders;
}

export function KanbanBoard({ initialOrders }: { initialOrders: OrderView[] }) {
  const { data: orders } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
    initialData: initialOrders,
    refetchInterval: 20000,
  });

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {ORDER_STATUSES.map((status) => {
        const columnOrders = orders.filter((order) => order.status === status);
        return (
          <div key={status} className="w-72 shrink-0 rounded-lg bg-zinc-50 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
              <h3 className="text-sm font-semibold">{ORDER_STATUS_LABELS[status]}</h3>
              <span className="text-xs text-zinc-500">{columnOrders.length}</span>
            </div>
            <div className="flex flex-col gap-2 p-2">
              {columnOrders.map((order) => (
                <Link
                  key={order.orderNumber}
                  href={`/orders/${order.orderNumber}`}
                  className="block rounded-md border border-zinc-200 bg-white p-3 text-sm shadow-sm hover:border-brand dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <p className="font-medium">SG-{order.orderNumber}</p>
                    {order.status !== "Delivered" && (
                      <PriorityBadge priority={getOrderPriority(order.createdAt, order.deliveryDate)} />
                    )}
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400">{order.customer.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Due{" "}
                    {new Date(order.deliveryDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}{" "}
                    · {order.city}
                  </p>
                </Link>
              ))}
              {columnOrders.length === 0 && <p className="px-1 py-4 text-center text-xs text-zinc-400">No orders</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
