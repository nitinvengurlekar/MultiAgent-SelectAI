import { Building2, MapPinned, Rows3 } from "lucide-react";

type StatsCardsProps = {
  rows: number;
  regions: number;
  counties: number;
};

export function StatsCards({ rows, regions, counties }: StatsCardsProps) {
  const stats = [
    { label: "Rows returned", value: rows, icon: Rows3 },
    { label: "Unique regions", value: regions, icon: MapPinned },
    { label: "Unique counties", value: counties, icon: Building2 }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-stone-500">{stat.label}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <stat.icon className="h-4 w-4" />
            </span>
          </div>
          <p className="text-3xl font-bold text-stone-950">{stat.value.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
