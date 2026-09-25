import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models/order";
import { StaffModel } from "@/lib/models/staff";
import { getSession, type SessionPayload } from "@/lib/auth";
import { orderStatusUpdateSchema, orderStageUpdateSchema, orderAssignSchema } from "@/lib/validation/order";
import { NEXT_ARTISAN_STAGE, type OrderStatus, type ArtisanStage, type DispatchMethod } from "@/lib/constants";

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
 * that transition has on `assignedArtisan`/`artisanStage`. Matches the
 * pipeline: an artisan self-assigns by picking a Pending order, then
 * progresses through their own accept/start/complete/dispatch sub-stages
 * (handled separately below) before Ready; staff release a stuck pick back
 * to Pending or do the final Ready->Delivered handoff; admin can force any
 * transition as a supervisory fallback.
 */
function resolveTransition(
  session: SessionPayload,
  from: OrderStatus,
  to: OrderStatus,
): { allowed: boolean; assignedArtisan?: string | null; artisanStage?: ArtisanStage | null } {
  if (session.role === "admin") {
    return {
      allowed: true,
      assignedArtisan: to === "Pending" ? null : undefined,
      artisanStage: to === "Pending" ? null : undefined,
    };
  }

  if (session.role === "staff") {
    if (from === "Ready" && to === "Delivered") return { allowed: true };
    if (from === "InProgress" && to === "Pending") {
      return { allowed: true, assignedArtisan: null, artisanStage: null };
    }
    return { allowed: false };
  }

  // artisan
  if (from === "Pending" && to === "InProgress") {
    return { allowed: true, assignedArtisan: session.staffId, artisanStage: "Accepted" };
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
  const { orderNumber } = await params;
  await connectDB();

  const current = await OrderModel.findOne({ orderNumber: Number(orderNumber) });
  if (!current) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const fromStatus = (current.status ?? "Pending") as OrderStatus;
  const currentAssignee = current.assignedArtisan ? current.assignedArtisan.toString() : null;

  // Path 0: admin assigning an unassigned Pending order to a specific
  // artisan. This is the only way an order picks up an assignee now — order
  // creation no longer takes an artisan, and artisans otherwise get orders by
  // self-picking (Path 2 below).
  if (body.assignedArtisan !== undefined) {
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const parsedAssign = orderAssignSchema.safeParse(body);
    if (!parsedAssign.success) {
      return NextResponse.json({ error: parsedAssign.error.issues[0]?.message ?? "Invalid artisan" }, { status: 400 });
    }
    if (fromStatus !== "Pending") {
      return NextResponse.json({ error: "Only pending orders can be assigned" }, { status: 409 });
    }
    if (!mongoose.isValidObjectId(parsedAssign.data.assignedArtisan)) {
      return NextResponse.json({ error: "Invalid artisan" }, { status: 400 });
    }
    const artisan = await StaffModel.findOne({ _id: parsedAssign.data.assignedArtisan, role: "artisan" });
    if (!artisan) {
      return NextResponse.json({ error: "Selected artisan not found" }, { status: 400 });
    }

    const order = await OrderModel.findOneAndUpdate(
      { orderNumber: Number(orderNumber), status: "Pending", assignedArtisan: null },
      { assignedArtisan: parsedAssign.data.assignedArtisan, artisanStage: "Accepted", status: "InProgress" },
      { returnDocument: "after" },
    );
    if (!order) {
      return NextResponse.json({ error: "Someone else already updated this order" }, { status: 409 });
    }
    return NextResponse.json({ order });
  }

  // Path 1: advancing the artisan's own sub-stage (Accepted -> Started ->
  // Completed -> Dispatched). Only the assigned artisan, only one step at a
  // time. Reaching Dispatched also flips the order's top-level status to
  // Ready, same as the old single "mark delivered to showroom" action did.
  if (body.artisanStage !== undefined) {
    const parsedStage = orderStageUpdateSchema.safeParse(body);
    if (!parsedStage.success) {
      return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
    }
    if (session.role !== "artisan" || fromStatus !== "InProgress" || currentAssignee !== session.staffId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const currentStage = (current.artisanStage ?? "Accepted") as ArtisanStage;
    const nextStage = NEXT_ARTISAN_STAGE[currentStage];
    if (!nextStage || parsedStage.data.artisanStage !== nextStage) {
      return NextResponse.json({ error: "Stages must be completed in order" }, { status: 400 });
    }

    const update: {
      artisanStage: ArtisanStage;
      status?: OrderStatus;
      dispatchMethod?: DispatchMethod;
      dispatchedByName?: string;
    } = { artisanStage: nextStage };
    if (nextStage === "Dispatched") {
      update.status = "Ready";
      update.dispatchMethod = parsedStage.data.dispatchMethod;
      update.dispatchedByName =
        parsedStage.data.dispatchMethod === "Pickup" ? parsedStage.data.dispatchedByName : undefined;
    }

    const order = await OrderModel.findOneAndUpdate(
      {
        orderNumber: Number(orderNumber),
        status: "InProgress",
        assignedArtisan: session.staffId,
        artisanStage: current.artisanStage ?? null,
      },
      update,
      { returnDocument: "after" },
    );
    if (!order) {
      return NextResponse.json({ error: "Someone else already updated this order" }, { status: 409 });
    }
    return NextResponse.json({ order });
  }

  // Path 2: the existing top-level status transitions (pick, release,
  // staff/admin actions).
  const parsed = orderStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const toStatus = parsed.data.status;

  // An admin's override can push an order straight to InProgress without
  // assigning an artisan (there's no per-artisan picker on that button). That
  // leaves it stuck — no "Pick" button (it's not Pending) and no way for any
  // artisan to take ownership. Let any artisan claim an unassigned
  // in-progress order, without changing its status.
  if (session.role === "artisan" && fromStatus === "InProgress" && toStatus === "InProgress" && !currentAssignee) {
    const claimed = await OrderModel.findOneAndUpdate(
      { orderNumber: Number(orderNumber), status: "InProgress", assignedArtisan: null },
      { assignedArtisan: session.staffId, artisanStage: "Accepted" },
      { returnDocument: "after" },
    );
    if (!claimed) {
      return NextResponse.json({ error: "Someone else already claimed this order" }, { status: 409 });
    }
    return NextResponse.json({ order: claimed });
  }

  if (fromStatus === toStatus) {
    return NextResponse.json({ error: "Order already has that status" }, { status: 409 });
  }

  const transition = resolveTransition(session, fromStatus, toStatus);
  if (!transition.allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const update: { status: OrderStatus; assignedArtisan?: string | null; artisanStage?: ArtisanStage | null } = {
    status: toStatus,
  };
  if (transition.assignedArtisan !== undefined) {
    update.assignedArtisan = transition.assignedArtisan;
  }
  if (transition.artisanStage !== undefined) {
    update.artisanStage = transition.artisanStage;
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
