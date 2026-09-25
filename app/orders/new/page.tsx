import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppHeader } from "@/app/_components/app-header";
import { NewOrderForm } from "./new-order-form";

export default async function NewOrderPage() {
  const session = await getSession();
  if (session?.role === "artisan") {
    redirect("/orders");
  }

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-8 pb-24 sm:pb-8">
        <h1 className="mb-6 text-xl font-semibold">New Order</h1>
        <NewOrderForm />
      </main>
    </div>
  );
}
