import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models/order";
import { toOrderView } from "@/lib/serialize";
import { AppHeader } from "@/app/_components/app-header";
import { StatusBadge } from "../_components/status-badge";
import { StatusAdvanceButton } from "../_components/status-advance-button";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  await connectDB();
  const doc = await OrderModel.findOne({ orderNumber: Number(orderNumber) }).lean();
  if (!doc) {
    notFound();
  }
  const order = toOrderView(doc);

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-8 pb-24 sm:pb-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold">Order SG-{order.orderNumber}</h1>
            <p className="text-sm text-zinc-500">
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <StatusAdvanceButton orderNumber={order.orderNumber} status={order.status} />
          <Link
            href={`/orders/${order.orderNumber}/docket`}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            View docket
          </Link>
        </div>

        <section className="mb-8 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="mb-3 text-sm font-semibold text-zinc-500">Customer</h2>
          <p className="font-medium">{order.customer.name}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{order.customer.phone}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{order.customer.address}</p>
        </section>

        <section className="mb-8 grid grid-cols-2 gap-4 rounded-lg border border-zinc-200 p-5 text-sm dark:border-zinc-800">
          <div>
            <h2 className="mb-1 text-xs font-semibold uppercase text-zinc-500">Delivery date</h2>
            <p>
              {new Date(order.deliveryDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          {order.labDetails && (
            <div>
              <h2 className="mb-1 text-xs font-semibold uppercase text-zinc-500">Lab</h2>
              <p>{order.labDetails}</p>
            </div>
          )}
          {order.advancePayment && (
            <div>
              <h2 className="mb-1 text-xs font-semibold uppercase text-zinc-500">Advance received</h2>
              <p>
                ₹{order.advancePayment.amount} on{" "}
                {new Date(order.advancePayment.date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-500">Items</h2>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                {item.photoUrl && (
                  <Image
                    src={item.photoUrl}
                    alt={item.itemType}
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-md object-cover"
                  />
                )}
                <div className="flex-1 text-sm">
                  <p className="font-medium">
                    {item.itemType} — {item.metal} {item.purity}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">{item.weightGrams} g</p>
                  {item.designDetails && (
                    <p className="mt-1 text-zinc-600 dark:text-zinc-400">{item.designDetails}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
