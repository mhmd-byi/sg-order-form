import Image from "next/image";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models/order";
import { toOrderView } from "@/lib/serialize";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { PrintButton } from "../../_components/print-button";

export default async function OrderDocketPage({
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
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <PrintButton />
      </div>

      <div className="mb-6 flex items-start justify-between border-b border-zinc-300 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-brand">Saifee Gold</h1>
          <p className="text-sm text-zinc-500">Order docket</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">SG-{order.orderNumber}</p>
          <p className="text-sm text-zinc-500">
            Order: {" "}
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
          <p className="text-sm text-zinc-500">
            Delivery:{" "}
            {new Date(order.deliveryDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
          <p className="text-sm text-zinc-500">{ORDER_STATUS_LABELS[order.status]}</p>
        </div>
      </div>

      <section className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-500">Customer</h2>
          <p className="font-medium">{order.customer.name}</p>
          <p className="text-sm">{order.customer.phone}</p>
          <p className="text-sm">{order.customer.address}</p>
        </div>
        <div>
          {order.labDetails && (
            <>
              <h2 className="mb-2 text-sm font-semibold text-zinc-500">Lab</h2>
              <p className="mb-3 text-sm">{order.labDetails}</p>
            </>
          )}
          {order.advancePayment && (
            <>
              <h2 className="mb-2 text-sm font-semibold text-zinc-500">Advance received</h2>
              <p className="text-sm">
                ₹{order.advancePayment.amount} on{" "}
                {new Date(order.advancePayment.date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-zinc-500">Items</h2>
        <div className="space-y-4">
          {order.items.map((item, index) => (
            <div key={index} className="flex gap-4 border border-zinc-300 p-4">
              {item.photoUrl && (
                <Image
                  src={item.photoUrl}
                  alt={item.itemType}
                  width={96}
                  height={96}
                  className="h-24 w-24 object-cover"
                />
              )}
              <div className="flex-1 text-sm">
                <p className="font-medium">
                  {index + 1}. {item.itemType} — {item.metal} {item.purity}
                </p>
                <p>{item.weightGrams} g</p>
                {item.designDetails && <p className="mt-1">{item.designDetails}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
