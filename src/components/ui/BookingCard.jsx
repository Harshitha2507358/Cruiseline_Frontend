import StatusBadge from './StatusBadge.jsx'
import { money } from '../../constants/enums.js'

// Passenger-friendly booking summary card (not a staff table row).
export default function BookingCard({ booking, actions }) {
  const lead = booking.passengers?.[0]?.name
  return (
    <div className="cl-booking-card">
      <div className="cl-booking-top">
        <div>
          <div className="cl-voyage-name">{booking.voyageName || `Voyage #${booking.voyageId}`}</div>
          <div className="text-muted small">
            Booking #{booking.bookingId}{lead ? ` · ${lead}` : ''}
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="cl-booking-grid">
        <div className="cl-kv"><div className="cl-kv-label">Cabin</div><div className="cl-kv-value">{booking.cabinNumber || `#${booking.cabinId}`}</div></div>
        <div className="cl-kv"><div className="cl-kv-label">Guests</div><div className="cl-kv-value">{booking.paxCount}</div></div>
        <div className="cl-kv"><div className="cl-kv-label">Booked</div><div className="cl-kv-value">{booking.bookingDate || '—'}</div></div>
        <div className="cl-kv"><div className="cl-kv-label">Total</div><div className="cl-kv-value">{money(booking.totalCost)}</div></div>
        <div className="cl-kv"><div className="cl-kv-label">Paid</div><div className="cl-kv-value">{money(booking.amountPaid)}</div></div>
        <div className="cl-kv"><div className="cl-kv-label">Balance</div><div className="cl-kv-value">{money(booking.balanceDue)}</div></div>
      </div>

      {actions && <div className="cl-booking-actions">{actions}</div>}
    </div>
  )
}
