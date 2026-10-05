import EmptyState from "./EmptyState.jsx";

// Declarative table. columns: [{ key, header, render?, align? }]. rows: array.
// rowKey: fn(row) → key. When rows is empty, renders `empty` or a default.
export default function DataTable({ columns, rows, rowKey, empty }) {
  if (!rows || rows.length === 0) {
    return empty || <EmptyState title="Nothing here yet" message="No records to show." />;
  }

  return (
    <div className="ui-table-wrap">
      <table className="ui-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.align ? { textAlign: col.align } : undefined}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, i) => (
            <tr key={rowKey ? rowKey(row) : i}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={col.align ? { textAlign: col.align } : undefined}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
