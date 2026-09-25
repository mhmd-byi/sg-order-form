import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models/order";
import { toOrderView } from "@/lib/serialize";
import { getSession } from "@/lib/auth";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { PrintButton } from "../../_components/print-button";
import { BottomNav } from "@/app/_components/bottom-nav";

export default async function OrderPrintPage({
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

  return (
    <div className="mx-auto w-full max-w-2xl px-6 pt-8 pb-24 sm:pb-8">
      <BottomNav isAdmin={session?.role === "admin"} canCreateOrders />
      <div className="mb-6 flex items-center justify-between print:hidden">
        <PrintButton />
      </div>

      <div className="mb-6 flex items-start justify-between border-b border-zinc-300 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-brand">Saifee Gold</h1>
          <p className="text-sm text-zinc-500">Order Form</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">Order No. {order.orderNumber}</p>
          <p className="text-sm text-zinc-500">
            Order Date:{" "}
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
          <p className="text-sm text-zinc-500">
            Delivery Date:{" "}
            {new Date(order.deliveryDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
          <p className="text-sm text-zinc-500">
            {ORDER_STATUS_LABELS[order.status]} · {order.city}
          </p>
        </div>
      </div>

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold text-zinc-500">Customer</h2>
        <p className="font-medium">{order.customer.name}</p>
        <p className="text-sm">{order.customer.phone}</p>
        <p className="text-sm">{order.customer.address}</p>
      </section>

      <section className="mb-6 grid grid-cols-2 gap-4 text-sm">
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
        {order.signatureUrl && (
          <div>
            <h2 className="mb-1 text-xs font-semibold uppercase text-zinc-500">Customer Signature</h2>
            <Image
              src={order.signatureUrl}
              alt="Customer signature"
              width={200}
              height={70}
              className="h-17.5 w-auto object-contain"
            />
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-zinc-500">Items</h2>
        <div className="space-y-4">
          {order.items.map((item, index) => (
            <div key={index} className="flex gap-4 border border-zinc-300 p-4 text-sm">
              {item.photoUrl && (
                <Image
                  src={item.photoUrl}
                  alt={item.itemType}
                  width={80}
                  height={80}
                  className="h-20 w-20 object-cover"
                />
              )}
              <div className="flex-1">
                <p className="font-medium">
                  {index + 1}. {item.itemType} — {item.metal} {item.purity}
                </p>
                <p>
                  {item.weightGrams} g
                  {item.size && ` · Size ${item.size}${item.sizeUnit ? ` ${item.sizeUnit}` : ""}`}
                </p>
                {item.labourType && (
                  <p>Labour: {item.labourType === "Percentage" ? `${item.labourValue}%` : `₹${item.labourValue}`}</p>
                )}
                {item.designDetails && <p className="mt-1">{item.designDetails}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
