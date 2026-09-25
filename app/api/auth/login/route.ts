import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { StaffModel } from "@/lib/models/staff";
import { createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 400 });
  }

  await connectDB();
  const staff = await StaffModel.findOne({ username: parsed.data.username.toLowerCase().trim() });
  if (!staff) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const passwordMatches = await bcrypt.compare(parsed.data.password, staff.passwordHash);
  if (!passwordMatches) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  await createSession({
    staffId: staff._id.toString(),
    username: staff.username,
    name: staff.name,
    role: staff.role ?? "staff",
    city: staff.city ?? "Indore",
  });

  return NextResponse.json({ ok: true });
}
