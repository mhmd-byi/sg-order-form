import { AppHeader } from "@/app/_components/app-header";
import { NewOrderForm } from "./new-order-form";

export default function NewOrderPage() {
  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <h1 className="mb-6 text-xl font-semibold">New Order</h1>
        <NewOrderForm />
      </main>
    </div>
  );
}
