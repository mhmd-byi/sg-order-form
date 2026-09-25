import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models/order";
import { toOrderView } from "@/lib/serialize";
import { getSession } from "@/lib/auth";
import { AppHeader } from "@/app/_components/app-header";
import { OrdersView } from "./_components/orders-view";
import { ArtisanOrdersView } from "./_components/artisan-orders-view";

export default async function OrdersPage() {
  const session = await getSession();

  await connectDB();
  // Artisans only see orders currently or previously assigned to them —
  // not the general Pending pool or other artisans' work.
  const query = session?.role === "artisan" ? { assignedArtisan: session.staffId } : {};
  const docs = await OrderModel.find(query).sort({ createdAt: -1 }).lean();
  const orders = docs.map(toOrderView);

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pt-8 pb-24 sm:pb-8">
        <h1 className="mb-6 text-xl font-semibold">Orders</h1>
        {session?.role === "artisan" ? <ArtisanOrdersView orders={orders} /> : <OrdersView orders={orders} />}
      </main>
    </div>
  );
}
