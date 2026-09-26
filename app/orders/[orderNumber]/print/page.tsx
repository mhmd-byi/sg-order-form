import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models/order";
import { toOrderView } from "@/lib/serialize";
import { getSession } from "@/lib/auth";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import type { OrderView } from "@/lib/types";
import { PrintButton } from "../../_components/print-button";
import { AppHeader } from "@/app/_components/app-header";

// Rendered twice per order (customer copy + showroom copy) so a single A4
// printout can be torn in half and one part handed to the customer while the
// showroom keeps the other. Print-only classes shrink text/spacing so both
// copies fit on one page for a typical few-item order; `print:break-inside-avoid`
// keeps a copy from being split across a page break if it doesn't.
function OrderFormSheet({ order, copyLabel }: { order: OrderView; copyLabel: string }) {
  return (
    <div className="print:break-inside-avoid print:text-[11px] print:leading-snug">
      <div className="mb-6 flex items-start justify-between border-b border-zinc-300 pb-4 print:mb-2 print:pb-1">
        <div>
          <h1 className="text-2xl font-semibold text-brand print:text-base">Saifee Gold</h1>
          <p className="text-sm text-zinc-500 print:text-[10px]">Order Form — {copyLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold print:text-sm">Order No. {order.orderNumber}</p>
          <p className="text-sm text-zinc-500 print:text-[10px]">
            Order Date:{" "}
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
          <p className="text-sm text-zinc-500 print:text-[10px]">
            Delivery Date:{" "}
            {new Date(order.deliveryDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
          <p className="text-sm text-zinc-500 print:text-[10px]">
            {ORDER_STATUS_LABELS[order.status]} · {order.city}
          </p>
        </div>
      </div>

      <section className="mb-6 print:mb-2">
        <h2 className="mb-2 text-sm font-semibold text-zinc-500 print:mb-0.5 print:text-[10px]">Customer</h2>
        <p className="font-medium">{order.customer.name}</p>
        <p className="text-sm">{order.customer.phone}</p>
        <p className="text-sm">{order.customer.address}</p>
      </section>

      <section className="mb-6 grid grid-cols-2 gap-4 text-sm print:mb-2 print:gap-2">
        <div>
          <h2 className="mb-1 text-xs font-semibold uppercase text-zinc-500 print:mb-0.5">Gold rate (with GST)</h2>
          <p>
            {order.rateStatus}
            {order.rateValue ? ` — ₹${order.rateValue}/g (${order.ratePurity})` : ""}
          </p>
        </div>
        {order.labDetails && (
          <div>
            <h2 className="mb-1 text-xs font-semibold uppercase text-zinc-500 print:mb-0.5">Lab</h2>
            <p>{order.labDetails}</p>
          </div>
        )}
        {order.advancePayment && (
          <div>
            <h2 className="mb-1 text-xs font-semibold uppercase text-zinc-500 print:mb-0.5">Advance received</h2>
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
            <h2 className="mb-1 text-xs font-semibold uppercase text-zinc-500 print:mb-0.5">Customer Signature</h2>
            {/* Inline data: URL, not a remote image — next/image has nothing to optimize here */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={order.signatureUrl} alt="Customer signature" className="h-17.5 w-auto object-contain print:h-10" />
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-zinc-500 print:mb-0.5 print:text-[10px]">Items</h2>
        <div className="space-y-4 print:space-y-1">
          {order.items.map((item, index) => (
            <div key={index} className="flex gap-4 border border-zinc-300 p-4 text-sm print:gap-2 print:p-1.5">
              {item.photoUrl && (
                <Image
                  src={item.photoUrl}
                  alt={item.itemType}
                  width={80}
                  height={80}
                  className="h-20 w-20 object-cover print:h-12 print:w-12"
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
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pt-8 pb-24 sm:pb-8">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <PrintButton />
        </div>

        <OrderFormSheet order={order} copyLabel="Customer Copy" />

        <div className="my-8 flex items-center gap-3 text-xs text-zinc-400 print:my-3">
          <span className="flex-1 border-t border-dashed border-zinc-400" />
          <span>✂ Cut here</span>
          <span className="flex-1 border-t border-dashed border-zinc-400" />
        </div>

        <OrderFormSheet order={order} copyLabel="Showroom Copy" />
      </main>
    </div>
  );
}
