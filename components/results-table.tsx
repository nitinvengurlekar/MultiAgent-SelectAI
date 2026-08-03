type ResultsTableProps = {
  rows: Record<string, unknown>[];
  columns: string[];
};

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toLocaleDateString();
  return String(value);
}

export function ResultsTable({ rows, columns }: ResultsTableProps) {
  if (!rows.length) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 bg-white p-10 text-center">
        <h3 className="text-lg font-semibold text-stone-950">No rows returned</h3>
        <p className="mt-2 text-sm text-stone-600">No rows returned for the current user and filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200 text-sm">
          <thead className="bg-stone-50">
            <tr>
              {columns.map((column) => (
                <th key={column} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase text-stone-500">
                  {column.replaceAll("_", " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((row, index) => (
              <tr key={index} className="hover:bg-stone-50">
                {columns.map((column) => (
                  <td key={column} className="max-w-80 px-4 py-3 text-stone-700">
                    <span className="line-clamp-2">{formatValue(row[column])}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
