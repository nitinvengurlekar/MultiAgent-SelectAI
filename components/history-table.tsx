import type { EcoHistoryItem } from "@/lib/ecoagency-types";

export function HistoryTable({ history }: { history: EcoHistoryItem[] }) {
  if (!history.length) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-600">
        No agent execution history is available yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200 text-sm">
          <thead className="bg-stone-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-stone-500">Started</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-stone-500">Agent</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-stone-500">Prompt</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-stone-500">Response</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {history.map((item, index) => (
              <tr key={`${item.startedAt}-${index}`} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 text-stone-600">{item.startedAt || "-"}</td>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-stone-800">{item.agentName || item.taskName || "-"}</td>
                <td className="max-w-sm px-4 py-3 text-stone-600">
                  <span className="line-clamp-3">{item.prompt || "-"}</span>
                </td>
                <td className="max-w-md px-4 py-3 text-stone-600">
                  <span className="line-clamp-3">{item.response || "-"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
