import Image from "next/image";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models/order";
import { toOrderView } from "@/lib/serialize";
import { getSession } from "@/lib/auth";
import { ARTISAN_STAGE_LABELS, NEXT_ARTISAN_STAGE, type ArtisanStage } from "@/lib/constants";
import { PrintButton } from "../../_components/print-button";
import { StatusActionButton } from "../../_components/status-action-button";
import { StageActionButton } from "../../_components/stage-action-button";
import { AppHeader } from "@/app/_components/app-header";

export default async function OrderDocketPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  const session = await getSession();

  await connectDB();
  const doc = await OrderModel.findOne({ orderNumber: Number(orderNumber) }).lean();
  if (!doc) {
    notFound();
  }
  const order = toOrderView(doc);

  const canPick =
    session?.role === "artisan" &&
    (order.status === "Pending" || (order.status === "InProgress" && !order.assignedArtisan));
  const isOwner =
    session?.role === "artisan" && order.status === "InProgress" && order.assignedArtisan === session.staffId;
  const currentStage: ArtisanStage | null = order.status === "InProgress" ? (order.artisanStage ?? "Accepted") : null;
  const nextStage = currentStage ? NEXT_ARTISAN_STAGE[currentStage] : null;

  const STAGE_ACTION_LABELS: Record<ArtisanStage, string> = {
    Accepted: "",
    Started: "Start work",
    Completed: "Mark completed",
    Dispatched: "Dispatch to showroom",
  };

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pt-8 pb-24 sm:pb-8">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <PrintButton />
          {canPick && (
            <StatusActionButton orderNumber={order.orderNumber} targetStatus="InProgress" label="Pick this order" />
          )}
          {isOwner && nextStage && (
            <StageActionButton
              orderNumber={order.orderNumber}
              targetStage={nextStage}
              label={STAGE_ACTION_LABELS[nextStage]}
            />
          )}
        </div>

        <div className="mb-6 flex items-start justify-between border-b border-zinc-300 pb-4">
          <div>
            <h1 className="text-2xl font-semibold text-brand">Saifee Gold</h1>
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
            {currentStage && <p className="text-sm text-zinc-500">Stage: {ARTISAN_STAGE_LABELS[currentStage]}</p>}
          </div>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-300">
              <th className="w-1/2 py-2 text-left font-semibold text-zinc-500">Particulars</th>
              <th className="py-2 text-left font-semibold text-zinc-500">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index} className="border-b border-zinc-300 align-top">
                <td className="py-3 pr-4">
                  {index + 1}. {item.itemType} — {item.metal} {item.purity}
                  <br />
                  {item.weightGrams} g
                  {item.size && ` · Size ${item.size}${item.sizeUnit ? ` ${item.sizeUnit}` : ""}`}
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
                  <div className="mt-1 flex gap-3 text-xs print:hidden">
                    {item.videoUrl && (
                      <a
                        href={item.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand hover:underline"
                      >
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
