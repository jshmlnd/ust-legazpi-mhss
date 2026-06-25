const DataTable = ({ columns, data, onRowClick, actions }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-neutral-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400"
                >
                  {col.label}
                </th>
              ))}
              {actions && <th className="px-6 py-3.5 w-20" />}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={row.id || i}
                className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 transition-colors"
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-3.5 text-sm text-neutral-900">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">{actions(row)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
