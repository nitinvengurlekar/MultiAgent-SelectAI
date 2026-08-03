"use client";

import { ShieldCheck, UserRound } from "lucide-react";
import type { Persona } from "@/lib/types";
import { cn } from "@/lib/utils";

type UserCardProps = {
  persona: Persona;
  selected: boolean;
  onSelect: () => void;
};

export function UserCard({ persona, selected, onSelect }: UserCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        selected ? "border-[#b33f2d] ring-2 ring-[#b33f2d]/20" : "border-stone-200"
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-lg", selected ? "bg-[#b33f2d] text-white" : "bg-stone-100 text-stone-700")}>
          {persona.id === "nisha" ? <ShieldCheck className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
        </span>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase text-stone-600">{persona.role}</span>
      </div>
      <h2 className="text-xl font-bold text-stone-950">Login as {persona.displayName}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">{persona.description}</p>
    </button>
  );
}
