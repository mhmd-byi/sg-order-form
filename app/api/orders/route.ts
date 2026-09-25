import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models/order";
import { StaffModel } from "@/lib/models/staff";
import { getSession } from "@/lib/auth";
import { getNextOrderNumber } from "@/lib/order-number";
import { orderCreateSchema } from "@/lib/validation/order";
import { toOrderView } from "@/lib/serialize";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role === "artisan") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const docs = await OrderModel.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ orders: docs.map(toOrderView) });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role === "artisan") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = orderCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid order" }, { status: 400 });
  }

  await connectDB();

  let assignedArtisan: string | undefined;
  if (parsed.data.assignedArtisan) {
    if (!mongoose.isValidObjectId(parsed.data.assignedArtisan)) {
      return NextResponse.json({ error: "Invalid artisan" }, { status: 400 });
    }
    const artisan = await StaffModel.findOne({ _id: parsed.data.assignedArtisan, role: "artisan" });
    if (!artisan) {
      return NextResponse.json({ error: "Selected artisan not found" }, { status: 400 });
    }
    assignedArtisan = parsed.data.assignedArtisan;
  }

  const orderNumber = await getNextOrderNumber();
  const order = await OrderModel.create({
    orderNumber,
    customer: parsed.data.customer,
    items: parsed.data.items,
    deliveryDate: parsed.data.deliveryDate,
    labDetails: parsed.data.labDetails,
    rateStatus: parsed.data.rateStatus,
    rateValue: parsed.data.rateValue,
    ratePurity: parsed.data.ratePurity,
    city: session.city,
    advancePayment: parsed.data.advancePayment,
    signatureUrl: parsed.data.signatureUrl,
    // A directly-assigned order is already being worked on, not waiting to be
    // picked from the pool, so it starts at InProgress instead of Pending.
    status: assignedArtisan ? "InProgress" : "Pending",
    assignedArtisan,
    createdBy: session.staffId,
  });

  return NextResponse.json({ order }, { status: 201 });
}
