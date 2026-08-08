import { Spinner } from 'react-bootstrap'

export default function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="cl-state">
      <Spinner animation="border" role="status" style={{ color: 'var(--cl-ocean)' }} />
      <div className="cl-state-text">{label}</div>
    </div>
  )
}
