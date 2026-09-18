import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models/order";
import { getSession } from "@/lib/auth";
import { getNextOrderNumber } from "@/lib/order-number";
import { orderCreateSchema } from "@/lib/validation/order";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const orders = await OrderModel.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = orderCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid order" }, { status: 400 });
  }

  await connectDB();
  const orderNumber = await getNextOrderNumber();
  const order = await OrderModel.create({
    orderNumber,
    customer: parsed.data.customer,
    items: parsed.data.items,
    deliveryDate: parsed.data.deliveryDate,
    labDetails: parsed.data.labDetails,
    advancePayment: parsed.data.advancePayment,
    createdBy: session.staffId,
  });

  return NextResponse.json({ order }, { status: 201 });
}
