import { cn } from "@/lib/utils";

type EcoBadgeProps = {
  children: React.ReactNode;
  tone?: "stone" | "green" | "blue" | "amber";
};

const tones = {
  stone: "bg-stone-100 text-stone-700 border-stone-200",
  green: "bg-emerald-50 text-emerald-800 border-emerald-200",
  blue: "bg-sky-50 text-sky-800 border-sky-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200"
};

export function EcoBadge({ children, tone = "stone" }: EcoBadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold", tones[tone])}>
      {children}
    </span>
  );
}
