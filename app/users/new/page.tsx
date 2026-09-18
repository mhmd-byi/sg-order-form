import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppHeader } from "@/app/_components/app-header";
import { NewUserForm } from "./new-user-form";

export default async function NewUserPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/orders");
  }

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-8">
        <h1 className="mb-6 text-xl font-semibold">New User</h1>
        <NewUserForm />
      </main>
    </div>
  );
}
