"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function AppHeader() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 print:hidden dark:border-zinc-800 dark:bg-zinc-950">
      <Link href="/orders" className="text-lg font-semibold text-brand">
        SG Order Form
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/orders" className="hover:underline">
          Orders
        </Link>
        <Link href="/orders/new" className="hover:underline">
          New Order
        </Link>
        <button
          onClick={handleLogout}
          className="text-zinc-500 hover:underline dark:text-zinc-400"
        >
          Log out
        </button>
      </nav>
    </header>
  );
}
