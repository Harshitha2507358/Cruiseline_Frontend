// Friendly empty state with optional icon and call-to-action.
export default function EmptyState({ icon = 'bi-inbox', title = 'Nothing here yet', message, action }) {
  return (
    <div className="cl-state">
      <i className={`bi ${icon} cl-state-icon`} />
      <div className="cl-state-title">{title}</div>
      {message && <div className="cl-state-text">{message}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
