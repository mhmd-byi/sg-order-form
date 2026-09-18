import Image from "next/image";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models/order";
import { toOrderView } from "@/lib/serialize";
import { PrintButton } from "../../_components/print-button";

export default async function OrderDocketPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  await connectDB();
  const doc = await OrderModel.findOne({
    orderNumber: Number(orderNumber),
  }).lean();
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
          <h1 className="text-2xl font-semibold text-brand">SG Order Form</h1>
          <p className="text-sm text-zinc-500">Job worker slip</p>
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
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-300">
            <th className="w-1/2 py-2 text-left font-semibold text-zinc-500">
              Particulars
            </th>
            <th className="py-2 text-left font-semibold text-zinc-500">
              Remarks
            </th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, index) => (
            <tr key={index} className="border-b border-zinc-300 align-top">
              <td className="py-3 pr-4">
                {index + 1}. {item.itemType} — {item.metal} {item.purity}
                <br />
                {item.weightGrams} g
              </td>
              <td className="py-3">
                {item.photoUrl && (
                  <Image
                    src={item.photoUrl}
                    alt={item.itemType}
                    width={64}
                    height={64}
                    className="mb-2 h-16 w-16 object-cover"
                  />
                )}
                {item.designDetails}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
