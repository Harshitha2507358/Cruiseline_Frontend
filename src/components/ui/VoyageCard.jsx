import { Button } from 'react-bootstrap'
import StatusBadge from './StatusBadge.jsx'
import { voyageGradient, WAVE_OVERLAY } from '../../assets/images.js'

// Attractive voyage card for passenger discovery. Only shows backend-supported data.
export default function VoyageCard({ voyage, onView, ctaLabel = 'View details' }) {
  const gradient = voyageGradient(`${voyage.voyageName}${voyage.homePort}`)
  return (
    <div className="cl-voyage-card">
      <div className="cl-voyage-banner" style={{ backgroundImage: `${WAVE_OVERLAY}, ${gradient}` }}>
        <span className="cl-voyage-port"><i className="bi bi-geo-alt-fill me-1" />{voyage.homePort}</span>
      </div>
      <div className="cl-voyage-body">
        <div className="cl-voyage-name">{voyage.voyageName}</div>
        <div className="cl-voyage-meta">
          {voyage.portsOfCall && <span><i className="bi bi-signpost-split me-2" />{voyage.portsOfCall}</span>}
          <span><i className="bi bi-calendar3 me-2" />{voyage.departureDate} → {voyage.returnDate}</span>
          <span><i className="bi bi-moon-stars me-2" />{voyage.durationNights} nights</span>
        </div>
      </div>
      <div className="cl-voyage-foot">
        <StatusBadge status={voyage.status} />
        <Button size="sm" className="cl-btn-primary" onClick={() => onView(voyage)}>{ctaLabel}</Button>
      </div>
    </div>
  )
}
