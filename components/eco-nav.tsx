"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, Network, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/conversations-ai", label: "Multi-Agent Conversational AI", icon: Network },
  { href: "/demo-mode", label: "DDS Demo", icon: ShieldCheck }
];

export function EcoNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8f3b2f] text-white">
            <Database className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold uppercase tracking-wide text-stone-950">EcoAgency Agentic Intelligence</span>
            <span className="hidden text-xs text-stone-500 sm:block">Oracle Select AI Agent + MCP</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-950",
                (pathname === item.href || pathname.startsWith(`${item.href}/`)) &&
                  "bg-stone-900 text-white hover:bg-stone-900 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
