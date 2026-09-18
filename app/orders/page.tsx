import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models/order";
import { toOrderView } from "@/lib/serialize";
import { AppHeader } from "./_components/app-header";
import { OrdersTable } from "./_components/orders-table";

export default async function OrdersPage() {
  await connectDB();
  const docs = await OrderModel.find().sort({ createdAt: -1 }).lean();
  const orders = docs.map(toOrderView);

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <h1 className="mb-6 text-xl font-semibold">Orders</h1>
        <OrdersTable orders={orders} />
      </main>
    </div>
  );
}
