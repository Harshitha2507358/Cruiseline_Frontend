import { Table } from 'react-bootstrap'
import LoadingState from './LoadingState.jsx'
import ErrorState from './ErrorState.jsx'
import EmptyState from './EmptyState.jsx'

/**
 * Reusable operational table with built-in loading/error/empty states.
 * columns: [{ key, header, render?(row), className?, headerClass? }]
 * rowKey:  (row) => unique key
 */
export default function DataTable({
  columns, rows, rowKey, onRowClick, loading, error, onRetry, empty, hover = true,
}) {
  if (loading) return <div className="cl-card"><LoadingState /></div>
  if (error) return <div className="cl-card"><ErrorState message={error} onRetry={onRetry} /></div>
  if (!rows || rows.length === 0) return <div className="cl-card"><EmptyState {...(empty || {})} /></div>

  return (
    <div className="cl-card cl-table-wrap">
      <Table hover={hover} responsive className="cl-table mb-0 align-middle">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.headerClass}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={onRowClick ? { cursor: 'pointer' } : undefined}
            >
              {columns.map((c) => (
                <td key={c.key} className={c.className}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
