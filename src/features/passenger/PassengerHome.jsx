import { useNavigate } from 'react-router-dom'
import { Button } from 'react-bootstrap'
import VoyageCard from '../../components/ui/VoyageCard.jsx'
import BookingCard from '../../components/ui/BookingCard.jsx'
import AsyncSection from '../../components/ui/AsyncSection.jsx'
import { useApi } from '../../hooks/useApi.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { voyageService } from '../../api/services/voyages.js'
import { bookingService } from '../../api/services/bookings.js'
import { HERO_GRADIENT, WAVE_OVERLAY } from '../../assets/images.js'

export default function PassengerHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const firstName = (user?.name || 'traveler').split(' ')[0]

  const voyages = useApi(() => voyageService.list({ status: 'OPEN', page: 0, size: 6 }), [])
  const bookings = useApi(() => bookingService.mine({ page: 0, size: 50 }), [])

  const openVoyages = (voyages.data?.content || []).slice(0, 3)
  const activeBooking = (bookings.data?.content || []).find((b) => b.status !== 'CANCELLED')

  return (
    <>
      <section className="cl-hero" style={{ backgroundImage: `${WAVE_OVERLAY}, ${HERO_GRADIENT}` }}>
        <div className="cl-hero-content">
          <h1>Where will you sail next, {firstName}?</h1>
          <p>Discover upcoming voyages and plan your next journey.</p>
          <Button className="cl-btn-gold" onClick={() => navigate('/explore')}>
            <i className="bi bi-compass me-2" />Explore voyages
          </Button>
        </div>
      </section>

      {activeBooking && (
        <div className="mb-4">
          <h2 className="cl-section-title">Your upcoming journey</h2>
          <BookingCard
            booking={activeBooking}
            actions={
              <>
                <Button size="sm" variant="outline-primary" onClick={() => navigate('/my-bookings')}>Manage booking</Button>
                {Number(activeBooking.balanceDue) > 0 && (
                  <Button size="sm" className="cl-btn-primary" onClick={() => navigate('/my-bookings')}>Pay balance</Button>
                )}
              </>
            }
          />
        </div>
      )}

      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="cl-section-title mb-0">Voyages open for booking</h2>
        <Button variant="link" onClick={() => navigate('/explore')}>See all <i className="bi bi-arrow-right" /></Button>
      </div>

      <AsyncSection
        loading={voyages.loading} error={voyages.error} onRetry={voyages.reload}
        isEmpty={openVoyages.length === 0}
        empty={{ icon: 'bi-water', title: 'No open voyages right now', message: 'Please check back soon.' }}
      >
        <div className="cl-voyage-grid">
          {openVoyages.map((v) => (
            <VoyageCard key={v.voyageId} voyage={v} ctaLabel="View & book"
              onView={(x) => navigate(`/voyages/${x.voyageId}`)} />
          ))}
        </div>
      </AsyncSection>
    </>
  )
}
