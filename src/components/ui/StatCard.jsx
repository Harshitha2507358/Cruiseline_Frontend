import { Link } from 'react-router-dom'

// Compact KPI tile. Optional `to` makes the whole card a link.
export default function StatCard({ icon, label, value, to, tone = 'navy', hint }) {
  const body = (
    <div className="cl-stat-card">
      <div className={`cl-stat-icon cl-tone-${tone}`}>
        <i className={`bi ${icon}`} />
      </div>
      <div className="cl-stat-meta">
        <div className="cl-stat-value">{value}</div>
        <div className="cl-stat-label">{label}</div>
        {hint && <div className="cl-stat-hint">{hint}</div>}
      </div>
    </div>
  )
  return to ? <Link to={to} className="cl-stat-link">{body}</Link> : body
}
