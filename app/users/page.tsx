import Link from "next/link";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { StaffModel } from "@/lib/models/staff";
import { getSession } from "@/lib/auth";
import { AppHeader } from "@/app/_components/app-header";

export default async function UsersPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/orders");
  }

  await connectDB();
  const users = await StaffModel.find().select("-passwordHash").sort({ createdAt: -1 }).lean();

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Users</h1>
          <Link
            href="/users/new"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
          >
            + Add user
          </Link>
        </div>

        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">Name</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">Username</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">Email</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={String(user._id)} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3">{user.username}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3 capitalize">{user.role}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
