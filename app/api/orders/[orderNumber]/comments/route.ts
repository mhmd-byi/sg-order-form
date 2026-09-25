import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models/order";
import { getSession } from "@/lib/auth";
import { orderCommentCreateSchema } from "@/lib/validation/order";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = orderCommentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid comment" }, { status: 400 });
  }

  const { orderNumber } = await params;
  await connectDB();

  const order = await OrderModel.findOneAndUpdate(
    { orderNumber: Number(orderNumber) },
    {
      $push: {
        comments: {
          authorId: session.staffId,
          authorName: session.name,
          authorRole: session.role,
          text: parsed.data.text,
          voiceNoteUrl: parsed.data.voiceNoteUrl,
          createdAt: new Date(),
        },
      },
    },
    { returnDocument: "after" },
  );
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order });
}
