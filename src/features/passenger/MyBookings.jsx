import { useState, useEffect } from 'react'
import { Button, Modal, Form, Row, Col, Alert } from 'react-bootstrap'
import PageHeader from '../../components/ui/PageHeader.jsx'
import BookingCard from '../../components/ui/BookingCard.jsx'
import AsyncSection from '../../components/ui/AsyncSection.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import { useApi } from '../../hooks/useApi.js'
import { useNotifications } from '../../notifications/NotificationContext.jsx'
import { bookingService } from '../../api/services/bookings.js'
import { voyageService } from '../../api/services/voyages.js'
import { money, humanize } from '../../constants/enums.js'
import { errMsg } from '../../api/client.js'

export default function MyBookings() {
  const { refresh } = useNotifications()
  const { data, loading, error, reload } = useApi(() => bookingService.mine({ page: 0, size: 50 }), [])
  const rows = data?.content || []

  const [pay, setPay] = useState(null)       // booking being paid
  const [amend, setAmend] = useState(null)   // booking being amended
  const [cancel, setCancel] = useState(null) // booking being cancelled
  const [busy, setBusy] = useState(false)
  const [dialogError, setDialogError] = useState('')

  async function afterChange() { setDialogError(''); reload(); refresh() }

  return (
    <>
      <PageHeader title="My Bookings" subtitle="Manage your reservations, payments, and cabin details." />

      <AsyncSection
        loading={loading} error={error} onRetry={reload}
        isEmpty={rows.length === 0}
        empty={{ icon: 'bi-journal-bookmark', title: 'No bookings yet', message: 'Explore voyages to plan your first trip.' }}
      >
        <div className="d-flex flex-column gap-3">
          {rows.map((b) => {
            const canPay = Number(b.balanceDue) > 0 && b.status !== 'CANCELLED'
            const canAmend = b.status === 'TENTATIVE'
            const canCancel = b.status !== 'CANCELLED' && b.status !== 'COMPLETED'
            return (
              <BookingCard key={b.bookingId} booking={b} actions={
                <>
                  {canPay && <Button size="sm" className="cl-btn-primary" onClick={() => { setDialogError(''); setPay(b) }}>Pay</Button>}
                  {canAmend && <Button size="sm" variant="outline-primary" onClick={() => { setDialogError(''); setAmend(b) }}>Amend</Button>}
                  {canCancel && <Button size="sm" variant="outline-danger" onClick={() => { setDialogError(''); setCancel(b) }}>Cancel</Button>}
                </>
              } />
            )
          })}
        </div>
      </AsyncSection>

      {pay && <PayModal booking={pay} busy={busy} setBusy={setBusy} error={dialogError} setError={setDialogError}
        onClose={() => setPay(null)} onDone={() => { setPay(null); afterChange() }} />}

      {amend && <AmendModal booking={amend} busy={busy} setBusy={setBusy} error={dialogError} setError={setDialogError}
        onClose={() => setAmend(null)} onDone={() => { setAmend(null); afterChange() }} />}

      <ConfirmDialog
        show={!!cancel} title="Cancel booking?"
        body={cancel && <>This will cancel booking #{cancel.bookingId} for {cancel.voyageName}. This cannot be undone.</>}
        confirmLabel="Cancel booking" busy={busy}
        onCancel={() => setCancel(null)}
        onConfirm={async () => {
          setBusy(true)
          try { await bookingService.cancel(cancel.bookingId); setCancel(null); afterChange() }
          catch (e) { alert(errMsg(e)) } finally { setBusy(false) }
        }}
      />
    </>
  )
}

function PayModal({ booking, busy, setBusy, error, setError, onClose, onDone }) {
  const [amount, setAmount] = useState(String(booking.balanceDue ?? ''))
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('')
    try { await bookingService.pay(booking.bookingId, Number(amount)); onDone() }
    catch (err) { setError(errMsg(err)) } finally { setBusy(false) }
  }
  return (
    <Modal show onHide={busy ? undefined : onClose} centered>
      <Form onSubmit={submit}>
        <Modal.Header closeButton={!busy}><Modal.Title>Record payment</Modal.Title></Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <p className="text-muted">Balance due: <strong>{money(booking.balanceDue)}</strong>. Paying in full confirms the booking.</p>
          <Form.Label>Amount</Form.Label>
          <Form.Control type="number" min="0.01" step="0.01" max={booking.balanceDue} value={amount}
            onChange={(e) => setAmount(e.target.value)} required />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" className="cl-btn-primary" disabled={busy}>{busy ? 'Processing…' : 'Pay'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

function AmendModal({ booking, busy, setBusy, error, setError, onClose, onDone }) {
  const [cats, setCats] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [cabins, setCabins] = useState([])
  const [cabinId, setCabinId] = useState(String(booking.cabinId))
  const [paxCount, setPaxCount] = useState(booking.paxCount)
  const [dining, setDining] = useState(booking.diningPreference || '')

  useEffect(() => { voyageService.categories(booking.voyageId).then(setCats).catch(() => {}) }, [booking.voyageId])
  useEffect(() => {
    if (!categoryId) { setCabins([]); return }
    voyageService.cabins(categoryId).then((l) => setCabins((l || []).filter((c) => c.status === 'AVAILABLE'))).catch(() => {})
  }, [categoryId])

  const maxOcc = cats.find((c) => String(c.categoryId) === String(categoryId))?.maxOccupancy

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      await bookingService.amend(booking.bookingId, {
        cabinId: Number(cabinId), paxCount: Number(paxCount), diningPreference: dining || null,
      })
      onDone()
    } catch (err) { setError(errMsg(err)) } finally { setBusy(false) }
  }

  return (
    <Modal show onHide={busy ? undefined : onClose} centered>
      <Form onSubmit={submit}>
        <Modal.Header closeButton={!busy}><Modal.Title>Amend booking #{booking.bookingId}</Modal.Title></Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Alert variant="info" className="small">Only tentative bookings can be amended. The total recalculates from the cabin category price × guests.</Alert>
          <Row className="g-3">
            <Col md={12}>
              <Form.Label>Change cabin category <span className="text-muted">(optional)</span></Form.Label>
              <Form.Select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setCabinId('') }}>
                <option value="">Keep current cabin ({booking.cabinNumber || `#${booking.cabinId}`})</option>
                {cats.map((c) => <option key={c.categoryId} value={c.categoryId}>{humanize(c.categoryName)} — {money(c.basePrice)} ({c.availableCabins} left)</option>)}
              </Form.Select>
            </Col>
            {categoryId && (
              <Col md={12}>
                <Form.Label>New cabin</Form.Label>
                <Form.Select value={cabinId} onChange={(e) => setCabinId(e.target.value)} required>
                  <option value="">Select an available cabin…</option>
                  {cabins.map((c) => <option key={c.cabinId} value={c.cabinId}>{c.cabinNumber} — Deck {c.deck || '—'} · {humanize(c.location)}</option>)}
                </Form.Select>
              </Col>
            )}
            <Col md={6}>
              <Form.Label>Guests</Form.Label>
              <Form.Control type="number" min={1} max={maxOcc || undefined} value={paxCount} onChange={(e) => setPaxCount(e.target.value)} />
            </Col>
            <Col md={6}>
              <Form.Label>Dining preference</Form.Label>
              <Form.Select value={dining} onChange={(e) => setDining(e.target.value)}>
                <option value="">No preference</option><option>Early seating</option><option>Late seating</option><option>Flexible</option>
              </Form.Select>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" className="cl-btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
