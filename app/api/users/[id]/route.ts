import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { StaffModel } from "@/lib/models/staff";
import { getSession } from "@/lib/auth";
import { staffUpdateSchema } from "@/lib/validation/staff";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = staffUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid user" }, { status: 400 });
  }

  await connectDB();

  const existing = await StaffModel.findOne({
    _id: { $ne: id },
    $or: [{ username: parsed.data.username.toLowerCase().trim() }, { email: parsed.data.email.toLowerCase().trim() }],
  });
  if (existing) {
    return NextResponse.json({ error: "Username or email already in use" }, { status: 409 });
  }

  const target = await StaffModel.findById(id);
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (target.role === "admin" && parsed.data.role !== "admin") {
    const adminCount = await StaffModel.countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "Cannot remove the last admin" }, { status: 400 });
    }
  }

  target.username = parsed.data.username.toLowerCase().trim();
  target.email = parsed.data.email.toLowerCase().trim();
  target.name = parsed.data.name;
  target.role = parsed.data.role;
  target.city = parsed.data.city;
  if (parsed.data.password) {
    target.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  }
  await target.save();

  return NextResponse.json({
    user: { username: target.username, email: target.email, name: target.name, role: target.role, city: target.city },
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (id === session.staffId) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  await connectDB();
  const target = await StaffModel.findById(id);
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (target.role === "admin") {
    const adminCount = await StaffModel.countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "Cannot delete the last admin" }, { status: 400 });
    }
  }

  await StaffModel.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
