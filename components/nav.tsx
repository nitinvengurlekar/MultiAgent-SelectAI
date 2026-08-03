"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Database, FileText, LogOut, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type NavProps = {
  user?: string;
};

export function Nav({ user }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const items = [
    { href: "/deepsec/results", label: "Explorer", icon: Search },
    { href: "/deepsec/about", label: "DDS Build", icon: FileText }
  ];

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/deepsec/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <Link href="/deepsec/dashboard" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#b33f2d] text-white">
            <Database className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold uppercase tracking-wide text-stone-950">Oracle Deep Data Security Demo</span>
            <span className="block text-xs text-stone-500">Autonomous Database 26ai</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-950",
                pathname === item.href && "bg-stone-900 text-white hover:bg-stone-900 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
          {user && <span className="ml-2 hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 sm:inline">{user}</span>}
          <button
            type="button"
            onClick={logout}
            className="flex h-10 items-center gap-2 rounded-md border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
