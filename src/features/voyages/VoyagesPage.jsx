import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Modal, Form, Row, Col, Alert } from 'react-bootstrap'
import PageHeader from '../../components/ui/PageHeader.jsx'
import DataTable from '../../components/ui/DataTable.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { useApi } from '../../hooks/useApi.js'
import { voyageService } from '../../api/services/voyages.js'
import { VOYAGE_STATUS, humanize } from '../../constants/enums.js'
import { errMsg } from '../../api/client.js'

const emptyForm = { voyageName: '', vesselId: '', homePort: '', departureDate: '', returnDate: '', durationNights: 7, portsOfCall: '', status: 'PLANNING' }

export default function VoyagesPage() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useApi(() => voyageService.list({ page: 0, size: 100 }), [])
  const all = data?.content || []

  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [show, setShow] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return all.filter((v) =>
      (!needle || `${v.voyageName} ${v.vesselId} ${v.homePort}`.toLowerCase().includes(needle)) &&
      (!status || v.status === status))
  }, [all, q, status])

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e) {
    e.preventDefault(); setBusy(true); setFormError('')
    try {
      await voyageService.create({ ...form, durationNights: Number(form.durationNights) })
      setShow(false); setForm(emptyForm); reload()
    } catch (err) { setFormError(errMsg(err)) } finally { setBusy(false) }
  }

  const columns = [
    { key: 'voyageId', header: 'ID' },
    { key: 'voyageName', header: 'Voyage', render: (v) => <span className="fw-semibold">{v.voyageName}</span> },
    { key: 'vesselId', header: 'Vessel' },
    { key: 'homePort', header: 'Home port' },
    { key: 'departureDate', header: 'Departs' },
    { key: 'durationNights', header: 'Nights' },
    { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v.status} /> },
  ]

  return (
    <>
      <PageHeader
        title="Voyages & Cabins"
        subtitle="Browse voyages. Click a row to manage its cabin categories and cabins."
        actions={<Button className="cl-btn-primary" onClick={() => { setFormError(''); setShow(true) }}><i className="bi bi-plus-lg me-2" />New Voyage</Button>}
      />

      <div className="cl-card cl-toolbar">
        <div className="cl-search"><i className="bi bi-search" />
          <Form.Control placeholder="Search by name, vessel, or port…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Form.Select style={{ maxWidth: 200 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {VOYAGE_STATUS.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
        </Form.Select>
        {(q || status) && <Button variant="outline-secondary" onClick={() => { setQ(''); setStatus('') }}>Reset</Button>}
      </div>

      <DataTable
        columns={columns} rows={rows} rowKey={(v) => v.voyageId}
        loading={loading} error={error} onRetry={reload}
        onRowClick={(v) => navigate(`/staff/voyages/${v.voyageId}`)}
        empty={{ icon: 'bi-water', title: 'No voyages found', message: 'Create a voyage to get started.' }}
      />

      <Modal show={show} onHide={() => setShow(false)} centered size="lg">
        <Form onSubmit={submit}>
          <Modal.Header closeButton><Modal.Title>New Voyage</Modal.Title></Modal.Header>
          <Modal.Body>
            {formError && <Alert variant="danger">{formError}</Alert>}
            <Row className="g-3">
              <Col md={8}><Form.Label>Voyage name</Form.Label><Form.Control value={form.voyageName} onChange={(e) => setField('voyageName', e.target.value)} required /></Col>
              <Col md={4}><Form.Label>Vessel ID</Form.Label><Form.Control value={form.vesselId} onChange={(e) => setField('vesselId', e.target.value)} required /></Col>
              <Col md={6}><Form.Label>Home port</Form.Label><Form.Control value={form.homePort} onChange={(e) => setField('homePort', e.target.value)} required /></Col>
              <Col md={3}><Form.Label>Departure</Form.Label><Form.Control type="date" value={form.departureDate} onChange={(e) => setField('departureDate', e.target.value)} required /></Col>
              <Col md={3}><Form.Label>Return</Form.Label><Form.Control type="date" value={form.returnDate} onChange={(e) => setField('returnDate', e.target.value)} required /></Col>
              <Col md={3}><Form.Label>Nights</Form.Label><Form.Control type="number" min={1} value={form.durationNights} onChange={(e) => setField('durationNights', e.target.value)} required /></Col>
              <Col md={9}><Form.Label>Ports of call <span className="text-muted">(comma-separated)</span></Form.Label><Form.Control value={form.portsOfCall} onChange={(e) => setField('portsOfCall', e.target.value)} placeholder="Marseille, Naples, Rome" /></Col>
              <Col md={12}><Form.Label>Status</Form.Label>
                <Form.Select value={form.status} onChange={(e) => setField('status', e.target.value)}>
                  {VOYAGE_STATUS.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
                </Form.Select>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShow(false)} disabled={busy}>Cancel</Button>
            <Button type="submit" className="cl-btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create voyage'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  )
}
