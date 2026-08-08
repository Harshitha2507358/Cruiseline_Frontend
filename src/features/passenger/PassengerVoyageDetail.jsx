import { useParams, useNavigate } from 'react-router-dom'
import { Button, Row, Col } from 'react-bootstrap'
import PageHeader from '../../components/ui/PageHeader.jsx'
import AsyncSection from '../../components/ui/AsyncSection.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { useApi } from '../../hooks/useApi.js'
import { voyageService } from '../../api/services/voyages.js'
import { HERO_GRADIENT, WAVE_OVERLAY, voyageGradient } from '../../assets/images.js'
import { money, humanize } from '../../constants/enums.js'

function Fact({ icon, label, value }) {
  return (
    <div className="d-flex align-items-center gap-2 mb-2">
      <i className={`bi ${icon}`} style={{ color: 'var(--cl-ocean)' }} />
      <span className="text-muted">{label}:</span>
      <span className="fw-semibold">{value}</span>
    </div>
  )
}

export default function PassengerVoyageDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const voyage = useApi(() => voyageService.get(id), [id])
  const categories = useApi(() => voyageService.categories(id), [id])

  const v = voyage.data
  const cats = categories.data || []
  const bookable = v?.status === 'OPEN'
  const banner = v ? voyageGradient(`${v.voyageName}${v.homePort}`) : HERO_GRADIENT

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Explore', to: '/explore' }, { label: v?.voyageName || 'Voyage' }]}
        title={v?.voyageName || 'Voyage'}
        actions={<Button variant="outline-secondary" onClick={() => navigate('/explore')}><i className="bi bi-arrow-left me-1" />Back</Button>}
      />

      <AsyncSection loading={voyage.loading} error={voyage.error} onRetry={voyage.reload}>
        {v && (
          <>
            <section className="cl-hero mb-4" style={{ backgroundImage: `${WAVE_OVERLAY}, ${banner}` }}>
              <div className="cl-hero-content">
                <div className="mb-2"><StatusBadge status={v.status} /></div>
                <h1>{v.voyageName}</h1>
                <p>Departing {v.homePort} · {v.durationNights} nights</p>
              </div>
            </section>

            <Row className="g-4">
              <Col md={5}>
                <div className="cl-card">
                  <h2 className="cl-section-title">Voyage details</h2>
                  <Fact icon="bi-geo-alt" label="Home port" value={v.homePort} />
                  <Fact icon="bi-signpost-split" label="Route" value={v.portsOfCall || '—'} />
                  <Fact icon="bi-calendar3" label="Departs" value={v.departureDate} />
                  <Fact icon="bi-calendar-check" label="Returns" value={v.returnDate} />
                  <Fact icon="bi-moon-stars" label="Nights" value={v.durationNights} />
                  <Fact icon="bi-buildings" label="Vessel" value={v.vesselId} />
                </div>
              </Col>

              <Col md={7}>
                <div className="cl-card">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="cl-section-title mb-0">Cabin categories</h2>
                    <Button className="cl-btn-primary" disabled={!bookable}
                      onClick={() => navigate(`/book/${v.voyageId}`)}>
                      <i className="bi bi-bag-check me-2" />Book this voyage
                    </Button>
                  </div>
                  {!bookable && <p className="text-muted small">This voyage is not open for booking.</p>}

                  <AsyncSection
                    loading={categories.loading} error={categories.error} onRetry={categories.reload}
                    isEmpty={cats.length === 0}
                    empty={{ icon: 'bi-door-closed', title: 'No cabin categories listed yet' }}
                  >
                    {cats.map((c) => (
                      <div key={c.categoryId} className="d-flex justify-content-between align-items-center py-3 border-bottom">
                        <div>
                          <div className="fw-semibold">{humanize(c.categoryName)}</div>
                          <div className="text-muted small">
                            Deck {c.deck || '—'} · {c.beddingConfig || '—'} · sleeps {c.maxOccupancy}
                          </div>
                          <div className="small mt-1"><StatusBadge status={c.status} /> · {c.availableCabins}/{c.totalCabins} available</div>
                        </div>
                        <div className="text-end">
                          <div className="cl-price">{money(c.basePrice)}<br /><small>per cabin</small></div>
                        </div>
                      </div>
                    ))}
                  </AsyncSection>
                </div>
              </Col>
            </Row>
          </>
        )}
      </AsyncSection>
    </>
  )
}
