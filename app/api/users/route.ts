import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { StaffModel } from "@/lib/models/staff";
import { getSession } from "@/lib/auth";
import { staffCreateSchema } from "@/lib/validation/staff";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const users = await StaffModel.find().select("-passwordHash").sort({ createdAt: -1 }).lean();
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = staffCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid user" }, { status: 400 });
  }

  await connectDB();
  const existing = await StaffModel.findOne({
    $or: [{ username: parsed.data.username.toLowerCase().trim() }, { email: parsed.data.email.toLowerCase().trim() }],
  });
  if (existing) {
    return NextResponse.json({ error: "Username or email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await StaffModel.create({
    username: parsed.data.username.toLowerCase().trim(),
    email: parsed.data.email.toLowerCase().trim(),
    passwordHash,
    name: parsed.data.name,
    role: parsed.data.role,
  });

  return NextResponse.json(
    { user: { username: user.username, email: user.email, name: user.name, role: user.role } },
    { status: 201 },
  );
}
