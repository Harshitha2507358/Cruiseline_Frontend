import { useState } from 'react'
import { Button, Modal, Form, Alert } from 'react-bootstrap'
import PageHeader from '../../components/ui/PageHeader.jsx'
import DataTable from '../../components/ui/DataTable.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import SearchableSelect from '../../components/ui/SearchableSelect.jsx'
import { useVoyageOptions } from '../../hooks/useOptions.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useNotifications } from '../../notifications/NotificationContext.jsx'
import { can } from '../../config/roles.js'
import { bookingService } from '../../api/services/bookings.js'
import { money } from '../../constants/enums.js'
import { BOOKING_STATUS, humanize } from '../../constants/enums.js'
import { errMsg } from '../../api/client.js'

export default function BookingsPage() {
  const { user } = useAuth()
  const { refresh } = useNotifications()
  const canPay = can(user?.role, 'PAY_BOOKING')
  const { options: voyageOptions } = useVoyageOptions()

  const [voyageId, setVoyageId] = useState('')
  const [rows, setRows] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [pay, setPay] = useState(null)

  async function load(vId = voyageId) {
    if (!vId) return
    setLoading(true); setError('')
    try {
      const page = await bookingService.byVoyage(vId, { page: 0, size: 100 })
      setRows(page?.content || [])
    } catch (e) { setError(errMsg(e)); setRows([]) } finally { setLoading(false) }
  }

  const filtered = (rows || []).filter((b) => {
    const lead = b.passengers?.[0]?.name || ''
    return (!q || `${lead} ${b.cabinNumber || ''}`.toLowerCase().includes(q.trim().toLowerCase())) &&
      (!status || b.status === status)
  })

  const columns = [
    { key: 'bookingId', header: 'ID' },
    { key: 'passenger', header: 'Passenger', render: (b) => b.passengers?.[0]?.name || `#${b.leadPassengerId}` },
    { key: 'cabinNumber', header: 'Cabin', render: (b) => b.cabinNumber || `#${b.cabinId}` },
    { key: 'paxCount', header: 'Pax' },
    { key: 'totalCost', header: 'Total', render: (b) => money(b.totalCost) },
    { key: 'amountPaid', header: 'Paid', render: (b) => money(b.amountPaid) },
    { key: 'balanceDue', header: 'Balance', render: (b) => money(b.balanceDue) },
    { key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.status} /> },
    {
      key: 'actions', header: '', className: 'text-end', render: (b) => (
        canPay && Number(b.balanceDue) > 0 && b.status !== 'CANCELLED'
          ? <Button size="sm" className="cl-btn-primary" onClick={() => setPay(b)}>Record payment</Button>
          : null
      ),
    },
  ]

  return (
    <>
      <PageHeader title={canPay && user.role === 'PURSER' ? 'Payments' : 'Bookings'}
        subtitle="Select a voyage to view its bookings and balances." />

      <div className="cl-card cl-toolbar">
        <div style={{ minWidth: 280, flex: 1 }}>
          <SearchableSelect options={voyageOptions} value={voyageId}
            onChange={(v) => { setVoyageId(v); load(v) }} placeholder="Select a voyage…" />
        </div>
        {rows && (
          <>
            <div className="cl-search"><i className="bi bi-search" />
              <Form.Control placeholder="Filter by passenger or cabin…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Form.Select style={{ maxWidth: 190 }} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {BOOKING_STATUS.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
            </Form.Select>
          </>
        )}
      </div>

      {rows === null && !loading
        ? <div className="cl-card"><div className="cl-state"><i className="bi bi-journal-bookmark cl-state-icon" /><div className="cl-state-title">Select a voyage</div><div className="cl-state-text">Choose a voyage above to load its bookings.</div></div></div>
        : <DataTable columns={columns} rows={filtered} rowKey={(b) => b.bookingId}
            loading={loading} error={error} onRetry={() => load()}
            empty={{ icon: 'bi-journal-bookmark', title: 'No bookings for this voyage' }} />}

      {pay && <PayModal booking={pay} onClose={() => setPay(null)}
        onDone={() => { setPay(null); load(); refresh() }} />}
    </>
  )
}

function PayModal({ booking, onClose, onDone }) {
  const [amount, setAmount] = useState(String(booking.balanceDue ?? ''))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr('')
    try { await bookingService.pay(booking.bookingId, Number(amount)); onDone() }
    catch (e2) { setErr(errMsg(e2)) } finally { setBusy(false) }
  }
  return (
    <Modal show onHide={busy ? undefined : onClose} centered>
      <Form onSubmit={submit}>
        <Modal.Header closeButton={!busy}><Modal.Title>Record payment — booking #{booking.bookingId}</Modal.Title></Modal.Header>
        <Modal.Body>
          {err && <Alert variant="danger">{err}</Alert>}
          <p className="text-muted">Balance due: <strong>{money(booking.balanceDue)}</strong>.</p>
          <Form.Label>Amount</Form.Label>
          <Form.Control type="number" min="0.01" step="0.01" max={booking.balanceDue} value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" className="cl-btn-primary" disabled={busy}>{busy ? 'Processing…' : 'Record payment'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
