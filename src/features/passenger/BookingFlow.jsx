import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Form, Row, Col, Alert } from 'react-bootstrap'
import PageHeader from '../../components/ui/PageHeader.jsx'
import AsyncSection from '../../components/ui/AsyncSection.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import SearchableSelect from '../../components/ui/SearchableSelect.jsx'
import { useApi } from '../../hooks/useApi.js'
import { voyageService } from '../../api/services/voyages.js'
import { bookingService } from '../../api/services/bookings.js'
import { money, humanize } from '../../constants/enums.js'
import { COUNTRIES } from '../../constants/countries.js'
import { errMsg } from '../../api/client.js'

// Small red asterisk for required-field labels.
const Req = () => <span className="text-danger"> *</span>

const STEPS = ['Cabin', 'Guest', 'Review', 'Payment', 'Done']

function Stepper({ step }) {
  return (
    <div className="cl-stepper">
      {STEPS.map((label, i) => (
        <span key={label} className="d-flex align-items-center">
          <span className={`cl-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
            <span className="cl-step-num">{i < step ? <i className="bi bi-check" /> : i + 1}</span>
            {label}
          </span>
          {i < STEPS.length - 1 && <i className="bi bi-chevron-right cl-step-sep mx-2" />}
        </span>
      ))}
    </div>
  )
}

const emptyLead = {
  name: '', dateOfBirth: '', gender: '', nationality: '', passportNumber: '',
  passportExpiry: '', dietaryRestrictions: '', medicalNotes: '', emergencyContact: '',
}

export default function BookingFlow() {
  const { voyageId } = useParams()
  const navigate = useNavigate()

  const voyage = useApi(() => voyageService.get(voyageId), [voyageId])
  const categories = useApi(() => voyageService.categories(voyageId), [voyageId])
  const cats = categories.data || []

  const [step, setStep] = useState(0)
  const [categoryId, setCategoryId] = useState('')
  const [cabins, setCabins] = useState([])
  const [loadingCabins, setLoadingCabins] = useState(false)
  const [cabinId, setCabinId] = useState('')
  const [paxCount, setPaxCount] = useState(1)
  const [dining, setDining] = useState('')
  const [lead, setLead] = useState(emptyLead)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [booking, setBooking] = useState(null)
  const [payAmount, setPayAmount] = useState('')

  const category = cats.find((c) => String(c.categoryId) === String(categoryId))
  const cabin = cabins.find((c) => String(c.cabinId) === String(cabinId))
  const maxOcc = category?.maxOccupancy || 1
  const total = category ? Number(category.basePrice) * Number(paxCount || 0) : 0

  // Load available cabins when the category changes.
  useEffect(() => {
    setCabinId('')
    setCabins([])
    if (!categoryId) { setLoadingCabins(false); return }
    setLoadingCabins(true)
    voyageService.cabins(categoryId)
      .then((list) => setCabins((list || []).filter((c) => c.status === 'AVAILABLE')))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoadingCabins(false))
  }, [categoryId])

  const setLeadField = (k, v) => setLead((l) => ({ ...l, [k]: v }))

  function nextFromCabin() {
    if (!categoryId || !cabinId || !paxCount) { setError('Choose a category, an available cabin, and number of guests.'); return }
    if (Number(paxCount) > maxOcc) { setError(`This cabin sleeps up to ${maxOcc} guests.`); return }
    setError(''); setStep(1)
  }
  function nextFromGuest() {
    if (!lead.name.trim()) { setError('Lead guest name is required.'); return }
    if (!lead.passportNumber.trim()) { setError('Passport number is required.'); return }
    if (!lead.passportExpiry) { setError('Passport expiry date is required.'); return }
    if (lead.emergencyContact.length !== 10) { setError('Emergency contact must be a 10-digit phone number.'); return }
    setError(''); setStep(2)
  }

  async function confirmBooking() {
    setBusy(true); setError('')
    try {
      const payload = {
        voyageId: Number(voyageId),
        cabinId: Number(cabinId),
        paxCount: Number(paxCount),
        diningPreference: dining || null,
        passengers: [{
          name: lead.name,
          dateOfBirth: lead.dateOfBirth || null,
          gender: lead.gender || null,
          nationality: lead.nationality || null,
          passportNumber: lead.passportNumber || null,
          passportExpiry: lead.passportExpiry || null,
          dietaryRestrictions: lead.dietaryRestrictions || null,
          medicalNotes: lead.medicalNotes || null,
          emergencyContact: lead.emergencyContact || null,
        }],
      }
      const created = await bookingService.create(payload)
      setBooking(created)
      setPayAmount(String(created.balanceDue ?? ''))
      setStep(3)
    } catch (e) {
      setError(errMsg(e))
    } finally { setBusy(false) }
  }

  async function pay() {
    setBusy(true); setError('')
    try {
      const updated = await bookingService.pay(booking.bookingId, Number(payAmount))
      setBooking(updated)
      setStep(4)
    } catch (e) {
      setError(errMsg(e))
    } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Explore', to: '/explore' }, { label: voyage.data?.voyageName || 'Voyage', to: `/voyages/${voyageId}` }, { label: 'Book' }]}
        title="Book your voyage"
        subtitle={voyage.data?.voyageName}
      />

      <AsyncSection loading={voyage.loading} error={voyage.error} onRetry={voyage.reload}>
        <div className="cl-card">
          <Stepper step={step} />
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

          {/* Step 1 — Cabin & trip */}
          {step === 0 && (
            <AsyncSection loading={categories.loading} error={categories.error} onRetry={categories.reload}
              isEmpty={cats.length === 0} empty={{ title: 'No cabin categories available for this voyage' }}>
              <div className="cl-form-section">
                <div className="cl-form-section-title">Choose your cabin</div>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Label>Category<Req /></Form.Label>
                    <Form.Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                      <option value="">Select a category…</option>
                      {cats.map((c) => (
                        <option key={c.categoryId} value={c.categoryId} disabled={c.availableCabins <= 0}>
                          {humanize(c.categoryName)} — {money(c.basePrice)} ({c.availableCabins} left)
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={6}>
                    <Form.Label>Cabin<Req /></Form.Label>
                    <Form.Select value={cabinId} onChange={(e) => setCabinId(e.target.value)} disabled={!categoryId}>
                      
                      <option value="">{!categoryId ? 'Choose a category first' : 'Select an available cabin…'}</option>
                      {cabins.map((c) => (
                        <option key={c.cabinId} value={c.cabinId}>
                          {c.cabinNumber} — Deck {c.deck || '—'} · {humanize(c.location)}
                        </option>
                      ))}
                    </Form.Select>
                    {categoryId && !loadingCabins && cabins.length === 0 && <Form.Text className="text-danger">No available cabins in this category.</Form.Text>}
                  </Col>
                  <Col md={6}>
                    <Form.Label>Guests<Req /></Form.Label>
                    <Form.Control type="number" min={1} max={maxOcc} value={paxCount}
                      onChange={(e) => setPaxCount(e.target.value)} />
                    
                    <Form.Text className="text-muted">{category ? `Up to ${maxOcc} guests.` : 'Select a category to set the guest limit.'}</Form.Text>
                  </Col>
                  <Col md={6}>
                    <Form.Label>Dining preference <span className="text-muted">(optional)</span></Form.Label>
                    <Form.Select value={dining} onChange={(e) => setDining(e.target.value)}>
                      <option value="">No preference</option>
                      <option>Early seating</option>
                      <option>Late seating</option>
                      <option>Flexible</option>
                    </Form.Select>
                  </Col>
                </Row>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <div className="cl-price">{money(total)} <small>total</small></div>
                <Button className="cl-btn-primary" onClick={nextFromCabin}>Continue<i className="bi bi-arrow-right ms-2" /></Button>
              </div>
            </AsyncSection>
          )}

          {/* Step 2 — Guest details */}
          {step === 1 && (
            <>
              <div className="cl-form-section-title">Lead guest details</div>
              <Row className="g-3">
                <Col md={6}><Form.Label>Full name<Req /></Form.Label><Form.Control value={lead.name} onChange={(e) => setLeadField('name', e.target.value)} /></Col>
                <Col md={3}><Form.Label>Date of birth</Form.Label><Form.Control type="date" value={lead.dateOfBirth} onChange={(e) => setLeadField('dateOfBirth', e.target.value)} /></Col>
                <Col md={3}><Form.Label>Gender</Form.Label>
                  <Form.Select value={lead.gender} onChange={(e) => setLeadField('gender', e.target.value)}>
                    <option value="">—</option><option>Female</option><option>Male</option><option>Other</option>
                  </Form.Select>
                </Col>
                <Col md={4}><Form.Label>Nationality</Form.Label>
                  <SearchableSelect options={COUNTRIES.map((c) => ({ value: c, label: c }))}
                    value={lead.nationality} onChange={(v) => setLeadField('nationality', v)}
                    placeholder="Select a country…" emptyText="No country matches" />
                </Col>
                <Col md={4}><Form.Label>Passport number<Req /></Form.Label><Form.Control value={lead.passportNumber} onChange={(e) => setLeadField('passportNumber', e.target.value)} required /></Col>
                <Col md={4}><Form.Label>Passport expiry<Req /></Form.Label><Form.Control type="date" value={lead.passportExpiry} onChange={(e) => setLeadField('passportExpiry', e.target.value)} required /></Col>
                <Col md={6}><Form.Label>Dietary restrictions</Form.Label><Form.Control value={lead.dietaryRestrictions} onChange={(e) => setLeadField('dietaryRestrictions', e.target.value)} /></Col>
                <Col md={6}><Form.Label>Medical notes</Form.Label><Form.Control value={lead.medicalNotes} onChange={(e) => setLeadField('medicalNotes', e.target.value)} /></Col>
                <Col md={12}><Form.Label>Emergency contact (phone)<Req /></Form.Label>
                  <Form.Control type="tel" inputMode="numeric" value={lead.emergencyContact}
                    onChange={(e) => setLeadField('emergencyContact', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit phone number" />
                  {lead.emergencyContact.length > 0 && lead.emergencyContact.length < 10 &&
                    <Form.Text className="text-danger">Please enter a valid phone number.</Form.Text>}
                </Col>
              </Row>
              <div className="d-flex justify-content-between mt-4">
                <Button variant="outline-secondary" onClick={() => setStep(0)}><i className="bi bi-arrow-left me-2" />Back</Button>
                <Button className="cl-btn-primary" onClick={nextFromGuest}>Continue<i className="bi bi-arrow-right ms-2" /></Button>
              </div>
            </>
          )}

          {/* Step 3 — Review */}
          {step === 2 && (
            <>
              <div className="cl-form-section-title">Review your booking</div>
              <div className="cl-booking-grid mb-3">
                <div className="cl-kv"><div className="cl-kv-label">Voyage</div><div className="cl-kv-value">{voyage.data?.voyageName}</div></div>
                <div className="cl-kv"><div className="cl-kv-label">Category</div><div className="cl-kv-value">{humanize(category?.categoryName)}</div></div>
                <div className="cl-kv"><div className="cl-kv-label">Cabin</div><div className="cl-kv-value">{cabin?.cabinNumber}</div></div>
                <div className="cl-kv"><div className="cl-kv-label">Guests</div><div className="cl-kv-value">{paxCount}</div></div>
                <div className="cl-kv"><div className="cl-kv-label">Dining</div><div className="cl-kv-value">{dining || 'No preference'}</div></div>
                <div className="cl-kv"><div className="cl-kv-label">Lead guest</div><div className="cl-kv-value">{lead.name}</div></div>
              </div>
              <div className="d-flex justify-content-between align-items-center border-top pt-3">
                <div className="cl-price">{money(total)} <small>total · balance due after booking</small></div>
                <div>
                  <Button variant="outline-secondary" className="me-2" onClick={() => setStep(1)} disabled={busy}><i className="bi bi-arrow-left me-2" />Back</Button>
                  <Button className="cl-btn-primary" onClick={confirmBooking} disabled={busy}>{busy ? 'Booking…' : 'Confirm booking'}</Button>
                </div>
              </div>
            </>
          )}

          {/* Step 4 — Payment */}
          {step === 3 && booking && (
            <>
              <Alert variant="success"><i className="bi bi-check-circle me-2" />Booking #{booking.bookingId} created — status <StatusBadge status={booking.status} />.</Alert>
              <div className="cl-form-section-title">Pay your balance</div>
              <p className="text-muted">Balance due: <strong>{money(booking.balanceDue)}</strong>. Pay in full to confirm your booking now, or pay later from “My Bookings”.</p>
              <Row className="g-3 align-items-end">
                <Col md={6}>
                  <Form.Label>Amount</Form.Label>
                  <Form.Control type="number" min="0.01" step="0.01" max={booking.balanceDue}
                    value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
                </Col>
                <Col md={6} className="d-flex gap-2">
                  <Button className="cl-btn-primary" onClick={pay} disabled={busy || !(Number(payAmount) > 0)}>{busy ? 'Processing…' : 'Pay now'}</Button>
                  <Button variant="outline-secondary" onClick={() => setStep(4)} disabled={busy}>Pay later</Button>
                </Col>
              </Row>
            </>
          )}

          {/* Step 5 — Confirmation */}
          {step === 4 && booking && (
            <div className="text-center py-4">
              <i className="bi bi-check-circle-fill" style={{ fontSize: '3rem', color: '#1f7a5a' }} />
              <h2 className="mt-3">You're all set!</h2>
              <p className="text-muted">Booking #{booking.bookingId} for {voyage.data?.voyageName}.</p>
              <div className="d-inline-flex flex-column align-items-start cl-card mt-2 text-start" style={{ minWidth: 280 }}>
                <div>Status: <StatusBadge status={booking.status} /></div>
                <div className="mt-2">Total: <strong>{money(booking.totalCost)}</strong></div>
                <div>Paid: <strong>{money(booking.amountPaid)}</strong></div>
                <div>Balance: <strong>{money(booking.balanceDue)}</strong></div>
              </div>
              <div className="mt-4 d-flex gap-2 justify-content-center">
                <Button className="cl-btn-primary" onClick={() => navigate('/my-bookings')}>Go to My Bookings</Button>
                <Button variant="outline-secondary" onClick={() => navigate('/explore')}>Explore more voyages</Button>
              </div>
            </div>
          )}
        </div>
      </AsyncSection>
    </>
  )
}
