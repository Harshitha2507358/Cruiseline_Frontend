import { Link } from 'react-router-dom'

// Consistent page title block: optional breadcrumbs, title, subtitle, right-aligned actions.
export default function PageHeader({ title, subtitle, actions, breadcrumbs }) {
  return (
    <div className="cl-page-header">
      <div>
        {breadcrumbs?.length > 0 && (
          <nav className="cl-breadcrumbs" aria-label="breadcrumb">
            {breadcrumbs.map((b, i) => (
              <span key={i}>
                {b.to ? <Link to={b.to}>{b.label}</Link> : <span>{b.label}</span>}
                {i < breadcrumbs.length - 1 && <i className="bi bi-chevron-right mx-1" />}
              </span>
            ))}
          </nav>
        )}
        <h1 className="cl-page-title">{title}</h1>
        {subtitle && <p className="cl-page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="cl-page-actions">{actions}</div>}
    </div>
  )
}
