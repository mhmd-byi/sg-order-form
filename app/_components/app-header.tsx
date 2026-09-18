import Link from "next/link";
import { getSession } from "@/lib/auth";
import { LogoutButton } from "./logout-button";
import { BottomNav } from "./bottom-nav";

export async function AppHeader() {
  const session = await getSession();
  const isAdmin = session?.role === "admin";

  return (
    <>
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 print:hidden dark:border-zinc-800 dark:bg-zinc-950">
        <Link href="/orders" className="text-lg font-semibold text-brand">
          SG Order Form
        </Link>
        <nav className="hidden items-center gap-4 text-sm sm:flex">
          <Link href="/orders" className="hover:underline">
            Orders
          </Link>
          <Link href="/orders/new" className="hover:underline">
            New Order
          </Link>
          {isAdmin && (
            <Link href="/users" className="hover:underline">
              Users
            </Link>
          )}
          <LogoutButton />
        </nav>
        <div className="sm:hidden">
          <LogoutButton />
        </div>
      </header>
      <BottomNav isAdmin={isAdmin} />
    </>
  );
}
