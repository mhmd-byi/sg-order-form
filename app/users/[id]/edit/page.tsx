import { redirect, notFound } from "next/navigation";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { StaffModel } from "@/lib/models/staff";
import { getSession } from "@/lib/auth";
import { AppHeader } from "@/app/_components/app-header";
import { EditUserForm } from "./edit-user-form";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/orders");
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    notFound();
  }

  await connectDB();
  const user = await StaffModel.findById(id).select("-passwordHash").lean();
  if (!user) {
    notFound();
  }

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-6 pt-8 pb-24 sm:pb-8">
        <h1 className="mb-6 text-xl font-semibold">Edit User</h1>
        <EditUserForm
          userId={id}
          initialValues={{
            username: user.username,
            email: user.email,
            name: user.name,
            role: user.role ?? "staff",
            city: user.city ?? "Indore",
          }}
        />
      </main>
    </div>
  );
}
