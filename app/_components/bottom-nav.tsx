"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, CirclePlus, Users } from "lucide-react";

const NAV_ITEMS = [
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/orders/new", label: "New Order", icon: CirclePlus },
];

const ADMIN_NAV_ITEM = { href: "/users", label: "Users", icon: Users };

export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;

  // Match the item whose href is the longest matching path segment prefix,
  // so e.g. /orders/778 highlights "Orders" rather than nothing, and
  // /orders/new highlights "New Order" rather than also matching "Orders".
  const activeHref = items
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] print:hidden sm:hidden dark:border-zinc-800 dark:bg-zinc-950">
      {items.map(({ href, label, icon: Icon }) => {
        const isActive = href === activeHref;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
              isActive ? "text-brand" : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
