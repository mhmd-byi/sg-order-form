import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models/order";
import { toOrderView } from "@/lib/serialize";
import { getSession } from "@/lib/auth";
import { NEXT_STATUS, ORDER_STATUS_LABELS, ARTISAN_STAGE_LABELS, type OrderStatus } from "@/lib/constants";
import { AppHeader } from "@/app/_components/app-header";
import { StatusBadge } from "../_components/status-badge";
import { StatusActionButton } from "../_components/status-action-button";
import { CommentSection } from "../_components/comment-section";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  const session = await getSession();
  if (session?.role === "artisan") {
    redirect(`/orders/${orderNumber}/docket`);
  }

  await connectDB();
  const doc = await OrderModel.findOne({ orderNumber: Number(orderNumber) }).lean();
  if (!doc) {
    notFound();
  }
  const order = toOrderView(doc);

  const actions: Array<{ targetStatus: OrderStatus; label: string; variant?: "primary" | "secondary" }> = [];
  if (session?.role === "admin") {
    const next = NEXT_STATUS[order.status];
    if (next) {
      actions.push({ targetStatus: next, label: `Mark as ${ORDER_STATUS_LABELS[next]}` });
    }
    if (order.status === "InProgress") {
      actions.push({ targetStatus: "Pending", label: "Release to Pending", variant: "secondary" });
    }
  } else if (session?.role === "staff") {
    if (order.status === "Ready") {
      actions.push({ targetStatus: "Delivered", label: "Mark as Delivered" });
    }
    if (order.status === "InProgress") {
      actions.push({ targetStatus: "Pending", label: "Release to Pending", variant: "secondary" });
    }
  }

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
              })}{" "}
              · {order.city}
            </p>
          </div>
          <div className="text-right">
            <StatusBadge status={order.status} />
            {order.status === "InProgress" && (
              <p className="mt-1 text-xs text-zinc-500">
                Artisan stage: {ARTISAN_STAGE_LABELS[order.artisanStage ?? "Accepted"]}
              </p>
            )}
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          {actions.map((action) => (
            <StatusActionButton key={action.targetStatus} orderNumber={order.orderNumber} {...action} />
          ))}
          <Link
            href={`/orders/${order.orderNumber}/docket`}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            View docket
          </Link>
          <Link
            href={`/orders/${order.orderNumber}/print`}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Print order form
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
          <div>
            <h2 className="mb-1 text-xs font-semibold uppercase text-zinc-500">Gold rate (with GST)</h2>
            <p>
              {order.rateStatus}
              {order.rateValue ? ` — ₹${order.rateValue}/g (${order.ratePurity})` : ""}
            </p>
          </div>
          {order.labDetails && (
            <div>
              <h2 className="mb-1 text-xs font-semibold uppercase text-zinc-500">Lab</h2>
              <p>{order.labDetails}</p>
            </div>
          )}
          {order.dispatchMethod && (
            <div>
              <h2 className="mb-1 text-xs font-semibold uppercase text-zinc-500">Dispatched by</h2>
              <p>
                {order.dispatchMethod}
                {order.dispatchMethod === "Pickup" && order.dispatchedByName ? ` — ${order.dispatchedByName}` : ""}
              </p>
            </div>
          )}
          {order.advancePayment && (
            <div>
              <h2 className="mb-1 text-xs font-semibold uppercase text-zinc-500">Advance received</h2>
              <p>
                {[
                  order.advancePayment.cashAmount != null ? `₹${order.advancePayment.cashAmount} cash` : null,
                  order.advancePayment.upiAmount != null ? `₹${order.advancePayment.upiAmount} UPI` : null,
                  order.advancePayment.goldGrams != null ? `${order.advancePayment.goldGrams} g gold` : null,
                ]
                  .filter(Boolean)
                  .join(" + ")}{" "}
                on{" "}
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
                  <p className="text-zinc-600 dark:text-zinc-400">
                    {item.weightGrams} g
                    {item.size && ` · Size ${item.size}${item.sizeUnit ? ` ${item.sizeUnit}` : ""}`}
                  </p>
                  {item.labourType && (
                    <p className="text-zinc-600 dark:text-zinc-400">
                      Labour: {item.labourType === "Percentage" ? `${item.labourValue}%` : `₹${item.labourValue}`}
                    </p>
                  )}
                  {item.designDetails && (
                    <p className="mt-1 text-zinc-600 dark:text-zinc-400">{item.designDetails}</p>
                  )}
                  <div className="mt-1 flex gap-3 text-xs">
                    {item.videoUrl && (
                      <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                        View video
                      </a>
                    )}
                    {item.voiceNoteUrl && (
                      <a
                        href={item.voiceNoteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand hover:underline"
                      >
                        Play voice note
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <CommentSection orderNumber={order.orderNumber} comments={order.comments} />
        </section>
      </main>
    </div>
  );
}
