import { Button } from 'react-bootstrap'

export default function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="cl-state">
      <i className="bi bi-exclamation-triangle cl-state-icon text-danger" />
      <div className="cl-state-text">{message}</div>
      {onRetry && (
        <Button variant="outline-secondary" size="sm" onClick={onRetry} className="mt-2">
          <i className="bi bi-arrow-clockwise me-1" /> Try again
        </Button>
      )}
    </div>
  )
}
