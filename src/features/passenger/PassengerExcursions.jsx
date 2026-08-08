import { useState } from 'react'
import { Button, Modal, Form, Alert, Badge } from 'react-bootstrap'
import PageHeader from '../../components/ui/PageHeader.jsx'
import AsyncSection from '../../components/ui/AsyncSection.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import SearchableSelect from '../../components/ui/SearchableSelect.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import { useApi } from '../../hooks/useApi.js'
import { useVoyageOptions } from '../../hooks/useOptions.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useNotifications } from '../../notifications/NotificationContext.jsx'
import { excursionService } from '../../api/services/excursions.js'
import { money, humanize } from '../../constants/enums.js'
import { errMsg } from '../../api/client.js'

export default function PassengerExcursions() {
  const { user } = useAuth()
  const { refresh } = useNotifications()
  const [port, setPort] = useState('')

  const excursions = useApi(() => excursionService.list({ page: 0, size: 50, portOfCall: port || undefined }), [])
  const myBookings = useApi(() => excursionService.bookingsByPassenger(user.userId, { page: 0, size: 50 }), [])
  const { options: voyageOptions } = useVoyageOptions()

  const [book, setBook] = useState(null) // excursion being booked
  const [voyageId, setVoyageId] = useState('')
  const [busy, setBusy] = useState(false)
  const [bookError, setBookError] = useState('')
  const [cancel, setCancel] = useState(null)

  const list = excursions.data?.content || []
  const bookings = myBookings.data?.content || []

  function applyPort(e) { e.preventDefault(); excursions.reload() }

  async function submitBook(e) {
    e.preventDefault(); setBusy(true); setBookError('')
    try {
      await excursionService.book({ excursionId: Number(book.excursionId), passengerId: Number(user.userId), voyageId: Number(voyageId) })
      setBook(null); setVoyageId('')
      myBookings.reload(); excursions.reload(); refresh()
    } catch (err) { setBookError(errMsg(err)) } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader title="Shore Excursions" subtitle="Add experiences to your voyage. You must have a cabin booking on the voyage to book an excursion." />

      <form className="cl-card cl-toolbar" onSubmit={applyPort}>
        <div className="cl-search">
          <i className="bi bi-search" />
          <Form.Control placeholder="Filter by port of call…" value={port} onChange={(e) => setPort(e.target.value)} />
        </div>
        <Button type="submit" className="cl-btn-primary">Search</Button>
        {port && <Button variant="outline-secondary" onClick={() => { setPort(''); setTimeout(() => excursions.reload(), 0) }}>Reset</Button>}
      </form>

      <AsyncSection
        loading={excursions.loading} error={excursions.error} onRetry={excursions.reload}
        isEmpty={list.length === 0} empty={{ icon: 'bi-map', title: 'No excursions found' }}
      >
        <div className="cl-voyage-grid mb-4">
          {list.map((x) => (
            <div key={x.excursionId} className="cl-card d-flex flex-column">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="cl-voyage-name" style={{ fontSize: '1.1rem' }}>{x.excursionName}</div>
                  <div className="text-muted small"><i className="bi bi-geo-alt me-1" />{x.portOfCall}</div>
                </div>
                <StatusBadge status={x.status} />
              </div>
              <div className="d-flex gap-2 flex-wrap my-2">
                {x.category && <Badge bg="light" text="dark">{humanize(x.category)}</Badge>}
                {x.difficultyLevel && <Badge bg="light" text="dark">{humanize(x.difficultyLevel)}</Badge>}
                {x.durationHours != null && <Badge bg="light" text="dark">{x.durationHours}h</Badge>}
              </div>
              <div className="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
                <div className="cl-price">{money(x.price)}</div>
                <Button size="sm" className="cl-btn-primary" disabled={x.status !== 'AVAILABLE'}
                  onClick={() => { setBookError(''); setBook(x) }}>Book</Button>
              </div>
              <div className="text-muted small mt-1">{x.bookedCount}/{x.maxCapacity} booked</div>
            </div>
          ))}
        </div>
      </AsyncSection>

      <h2 className="cl-section-title">My excursion bookings</h2>
      <AsyncSection
        loading={myBookings.loading} error={myBookings.error} onRetry={myBookings.reload}
        isEmpty={bookings.length === 0} empty={{ icon: 'bi-ticket-perforated', title: 'No excursion bookings yet' }}
      >
        <div className="cl-card">
          {bookings.map((b) => (
            <div key={b.exBookingId} className="d-flex justify-content-between align-items-center py-2 border-bottom">
              <div>
                <div className="fw-semibold">Excursion #{b.excursionId}</div>
                <div className="text-muted small">Voyage #{b.voyageId} · booked {b.bookingDate} · {money(b.price)}</div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <StatusBadge status={b.status} />
                {b.status !== 'CANCELLED' && <Button size="sm" variant="outline-danger" onClick={() => setCancel(b)}>Cancel</Button>}
              </div>
            </div>
          ))}
        </div>
      </AsyncSection>

      {/* Book modal */}
      <Modal show={!!book} onHide={() => setBook(null)} centered>
        <Form onSubmit={submitBook}>
          <Modal.Header closeButton><Modal.Title>Book “{book?.excursionName}”</Modal.Title></Modal.Header>
          <Modal.Body>
            {bookError && <Alert variant="danger">{bookError}</Alert>}
            <p className="text-muted small">Choose the voyage you're sailing on. You need an active cabin booking on it.</p>
            <Form.Label>Voyage</Form.Label>
            <SearchableSelect options={voyageOptions} value={voyageId} onChange={setVoyageId} placeholder="Select your voyage…" required />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setBook(null)} disabled={busy}>Cancel</Button>
            <Button type="submit" className="cl-btn-primary" disabled={busy || !voyageId}>{busy ? 'Booking…' : 'Confirm booking'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ConfirmDialog
        show={!!cancel} title="Cancel excursion booking?"
        body={cancel && <>Cancel your booking for excursion #{cancel.excursionId}?</>}
        confirmLabel="Cancel booking" busy={busy}
        onCancel={() => setCancel(null)}
        onConfirm={async () => {
          setBusy(true)
          try { await excursionService.cancelBooking(cancel.exBookingId); setCancel(null); myBookings.reload(); excursions.reload() }
          catch (e) { alert(errMsg(e)) } finally { setBusy(false) }
        }}
      />
    </>
  )
}
