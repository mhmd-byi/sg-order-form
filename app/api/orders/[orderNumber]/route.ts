import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models/order";
import { getSession, type SessionPayload } from "@/lib/auth";
import { orderStatusUpdateSchema } from "@/lib/validation/order";
import type { OrderStatus } from "@/lib/constants";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderNumber } = await params;
  await connectDB();
  const order = await OrderModel.findOne({ orderNumber: Number(orderNumber) }).lean();
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order });
}

/**
 * Who can move an order from `from` to `to`, and what side effect (if any)
 * that transition has on `assignedArtisan`. Matches the pipeline: an artisan
 * self-assigns by picking a Pending order, then hands off to Ready once done;
 * staff release a stuck pick back to Pending or do the final Ready->Delivered
 * handoff; admin can force any transition as a supervisory fallback.
 */
function resolveTransition(
  session: SessionPayload,
  from: OrderStatus,
  to: OrderStatus,
  currentAssignee: string | null,
): { allowed: boolean; assignedArtisan?: string | null } {
  if (session.role === "admin") {
    return { allowed: true, assignedArtisan: to === "Pending" ? null : undefined };
  }

  if (session.role === "staff") {
    if (from === "Ready" && to === "Delivered") return { allowed: true };
    if (from === "InProgress" && to === "Pending") return { allowed: true, assignedArtisan: null };
    return { allowed: false };
  }

  // artisan
  if (from === "Pending" && to === "InProgress") {
    return { allowed: true, assignedArtisan: session.staffId };
  }
  if (from === "InProgress" && to === "Ready" && currentAssignee === session.staffId) {
    return { allowed: true };
  }
  return { allowed: false };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = orderStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { orderNumber } = await params;
  await connectDB();

  const current = await OrderModel.findOne({ orderNumber: Number(orderNumber) });
  if (!current) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const fromStatus = (current.status ?? "Pending") as OrderStatus;
  const toStatus = parsed.data.status;
  const currentAssignee = current.assignedArtisan ? current.assignedArtisan.toString() : null;

  if (fromStatus === toStatus) {
    return NextResponse.json({ error: "Order already has that status" }, { status: 409 });
  }

  const transition = resolveTransition(session, fromStatus, toStatus, currentAssignee);
  if (!transition.allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const update: { status: OrderStatus; assignedArtisan?: string | null } = { status: toStatus };
  if (transition.assignedArtisan !== undefined) {
    update.assignedArtisan = transition.assignedArtisan;
  }

  // Atomic: condition on the status (and, for a pick, on nobody already having
  // grabbed it) so two people racing the same transition can't both succeed.
  const filter: Record<string, unknown> = { orderNumber: Number(orderNumber), status: fromStatus };
  if (fromStatus === "Pending" && toStatus === "InProgress") {
    filter.assignedArtisan = null;
  }

  const order = await OrderModel.findOneAndUpdate(filter, update, { returnDocument: "after" });
  if (!order) {
    return NextResponse.json({ error: "Someone else already updated this order" }, { status: 409 });
  }

  return NextResponse.json({ order });
}
