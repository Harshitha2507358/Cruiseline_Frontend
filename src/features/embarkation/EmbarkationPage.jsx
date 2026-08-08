import { useState } from 'react'
import { Tabs, Tab, Button, Form, Row, Col, Alert, Modal } from 'react-bootstrap'
import PageHeader from '../../components/ui/PageHeader.jsx'
import DataTable from '../../components/ui/DataTable.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import SearchableSelect from '../../components/ui/SearchableSelect.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { useVoyageOptions, usePassengerOptions, labelFor } from '../../hooks/useOptions.js'
import { useNotifications } from '../../notifications/NotificationContext.jsx'
import { embarkationService } from '../../api/services/embarkation.js'
import { ATTENDANCE_STATUS, EMBARKATION_STATUS, humanize } from '../../constants/enums.js'
import { errMsg } from '../../api/client.js'

export default function EmbarkationPage() {
  const { refresh } = useNotifications()
  const { options: voyageOptions } = useVoyageOptions()
  const { options: passengerOptions } = usePassengerOptions()

  const [voyageId, setVoyageId] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [stations, setStations] = useState([])
  const [queue, setQueue] = useState([])
  const [drills, setDrills] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editStation, setEditStation] = useState(null)
  const [editDrill, setEditDrill] = useState(null)

  const stationOptions = stations.map((s) => ({ value: String(s.musterId), label: s.stationCode, sublabel: `Deck ${s.deck || '—'} · cap ${s.capacity}` }))

  async function load(vId = voyageId) {
    if (!vId) return
    setLoading(true); setError(''); setNotice('')
    try {
      const [st, q, dr] = await Promise.all([
        embarkationService.musterStations(vId),
        embarkationService.queue(vId, { page: 0, size: 100 }),
        embarkationService.drills(vId),
      ])
      setStations(st || [])
      setQueue(q?.content || [])
      setDrills(dr || [])
      setLoaded(true)
    } catch (e) { setError(errMsg(e)) } finally { setLoading(false) }
  }

  function flash(msg) { setNotice(msg); refresh(); load() }

  return (
    <>
      <PageHeader title="Embarkation" subtitle="Select a voyage to process its passenger manifest, muster stations, and drills." />

      <div className="cl-card cl-toolbar">
        <div style={{ minWidth: 300, flex: 1 }}>
          <SearchableSelect options={voyageOptions} value={voyageId} onChange={(v) => { setVoyageId(v); setLoaded(false) }} placeholder="Select a voyage…" />
        </div>
        <Button className="cl-btn-primary" onClick={() => load()} disabled={!voyageId || loading}>
          <i className="bi bi-box-arrow-in-down me-2" />Load
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {notice && <Alert variant="success" dismissible onClose={() => setNotice('')}>{notice}</Alert>}

      {!loaded
        ? <div className="cl-card"><EmptyState icon="bi-door-open" title="No voyage loaded" message="Choose a voyage and press Load to begin." /></div>
        : (
          <Tabs defaultActiveKey="manifest" className="mb-3">
            <Tab eventKey="manifest" title="Manifest & Check-in">
              <CheckInForm voyageId={voyageId} passengerOptions={passengerOptions} stationOptions={stationOptions}
                onDone={() => flash('Passenger checked in.')} onError={setError} />
              <DataTable
                columns={[
                  { key: 'embarkRecordId', header: 'Rec' },
                  { key: 'passenger', header: 'Passenger', render: (r) => labelFor(passengerOptions, r.passengerId) },
                  { key: 'documentVerified', header: 'Verified', render: (r) => r.documentVerified ? <i className="bi bi-check-lg text-success" /> : '—' },
                  { key: 'boardingPassIssued', header: 'Boarding pass', render: (r) => r.boardingPassIssued ? <i className="bi bi-check-lg text-success" /> : '—' },
                  { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
                  {
                    key: 'actions', header: '', className: 'text-end', render: (r) => r.status === 'CHECKED_IN'
                      ? <Button size="sm" className="cl-btn-primary" onClick={async () => { try { await embarkationService.markOnboard(r.embarkRecordId); flash('Passenger marked onboard.') } catch (e) { setError(errMsg(e)) } }}>Mark onboard</Button>
                      : null,
                  },
                ]}
                rows={queue} rowKey={(r) => r.embarkRecordId}
                empty={{ icon: 'bi-people', title: 'No passengers checked in yet' }}
              />
            </Tab>

            <Tab eventKey="muster" title="Muster stations">
              <MusterForm voyageId={voyageId} onDone={() => flash('Muster station created.')} onError={setError} />
              <DataTable
                columns={[
                  { key: 'musterId', header: 'ID' },
                  { key: 'stationCode', header: 'Code' },
                  { key: 'deck', header: 'Deck', render: (s) => s.deck || '—' },
                  { key: 'assignedCabinRange', header: 'Cabin range', render: (s) => s.assignedCabinRange || '—' },
                  { key: 'capacity', header: 'Capacity' },
                  { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
                  {
                    key: 'actions', header: '', className: 'text-end',
                    render: (s) => <Button size="sm" variant="outline-primary" onClick={() => setEditStation(s)}><i className="bi bi-pencil me-1" />Edit</Button>,
                  },
                ]}
                rows={stations} rowKey={(s) => s.musterId}
                empty={{ icon: 'bi-signpost', title: 'No muster stations yet' }}
              />
            </Tab>

            <Tab eventKey="drills" title="Drill attendance">
              <DrillForm voyageId={voyageId} passengerOptions={passengerOptions} stationOptions={stationOptions}
                onDone={() => flash('Drill attendance recorded.')} onError={setError} />
              <DataTable
                columns={[
                  { key: 'drillId', header: 'ID' },
                  { key: 'passenger', header: 'Passenger', render: (d) => labelFor(passengerOptions, d.passengerId) },
                  { key: 'musterId', header: 'Station', render: (d) => labelFor(stationOptions, d.musterId) },
                  { key: 'drillDate', header: 'Date' },
                  { key: 'attendanceStatus', header: 'Attendance', render: (d) => <StatusBadge status={d.attendanceStatus} /> },
                  {
                    key: 'actions', header: '', className: 'text-end',
                    render: (d) => <Button size="sm" variant="outline-primary" onClick={() => setEditDrill(d)}><i className="bi bi-pencil me-1" />Edit</Button>,
                  },
                ]}
                rows={drills} rowKey={(d) => d.drillId}
                empty={{ icon: 'bi-clipboard-check', title: 'No drill records yet' }}
              />
            </Tab>
          </Tabs>
        )}

      {editStation && (
        <MusterEditModal station={editStation} voyageId={voyageId}
          onClose={() => setEditStation(null)}
          onDone={() => { setEditStation(null); flash('Muster station updated.') }}
          onError={setError} />
      )}
      {editDrill && (
        <DrillEditModal drill={editDrill} stationOptions={stationOptions} passengerOptions={passengerOptions}
          onClose={() => setEditDrill(null)}
          onDone={() => { setEditDrill(null); flash('Drill attendance updated.') }}
          onError={setError} />
      )}
    </>
  )
}

function CheckInForm({ voyageId, passengerOptions, stationOptions, onDone, onError }) {
  const [passengerId, setPassengerId] = useState('')
  const [documentVerified, setDocumentVerified] = useState(true)
  const [musterStationId, setMusterStationId] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault(); setBusy(true)
    try {
      await embarkationService.checkIn({
        passengerId: Number(passengerId), voyageId: Number(voyageId),
        documentVerified, musterStationId: musterStationId ? Number(musterStationId) : null,
      })
      setPassengerId(''); setMusterStationId(''); onDone()
    } catch (e2) { onError(errMsg(e2)) } finally { setBusy(false) }
  }
  return (
    <Form onSubmit={submit} className="cl-card mb-3">
      <div className="cl-form-section-title">Check in a passenger</div>
      <Row className="g-3 align-items-end">
        <Col md={5}><Form.Label>Passenger</Form.Label>
          <SearchableSelect options={passengerOptions} value={passengerId} onChange={setPassengerId} placeholder="Select passenger…" required />
        </Col>
        <Col md={4}><Form.Label>Muster station <span className="text-muted">(optional)</span></Form.Label>
          <SearchableSelect options={stationOptions} value={musterStationId} onChange={setMusterStationId} placeholder="Assign station…" emptyText="No stations yet" />
        </Col>
        <Col md={3}>
          <Form.Check type="switch" id="docverif" label="Documents verified" checked={documentVerified} onChange={(e) => setDocumentVerified(e.target.checked)} className="mb-2" />
          <Button type="submit" className="cl-btn-primary w-100" disabled={busy || !passengerId}>{busy ? 'Checking in…' : 'Check in'}</Button>
        </Col>
      </Row>
    </Form>
  )
}

function MusterForm({ voyageId, onDone, onError }) {
  const [form, setForm] = useState({ stationCode: '', deck: '', assignedCabinRange: '', capacity: 2 })
  const [busy, setBusy] = useState(false)
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  async function submit(e) {
    e.preventDefault(); setBusy(true)
    try {
      await embarkationService.createMusterStation({ voyageId: Number(voyageId), stationCode: form.stationCode, deck: form.deck, assignedCabinRange: form.assignedCabinRange, capacity: Number(form.capacity) })
      setForm({ stationCode: '', deck: '', assignedCabinRange: '', capacity: 2 }); onDone()
    } catch (e2) { onError(errMsg(e2)) } finally { setBusy(false) }
  }
  return (
    <Form onSubmit={submit} className="cl-card mb-3">
      <div className="cl-form-section-title">New muster station</div>
      <Row className="g-3 align-items-end">
        <Col md={3}><Form.Label>Code</Form.Label><Form.Control value={form.stationCode} onChange={(e) => setField('stationCode', e.target.value)} required /></Col>
        <Col md={2}><Form.Label>Deck</Form.Label><Form.Control value={form.deck} onChange={(e) => setField('deck', e.target.value)} /></Col>
        <Col md={4}><Form.Label>Cabin range</Form.Label><Form.Control value={form.assignedCabinRange} onChange={(e) => setField('assignedCabinRange', e.target.value)} placeholder="9000-9050" /></Col>
        <Col md={2}><Form.Label>Capacity</Form.Label><Form.Control type="number" min={1} value={form.capacity} onChange={(e) => setField('capacity', e.target.value)} required /></Col>
        <Col md={1}><Button type="submit" className="cl-btn-primary w-100" disabled={busy}>Add</Button></Col>
      </Row>
    </Form>
  )
}

function DrillForm({ voyageId, passengerOptions, stationOptions, onDone, onError }) {
  const [form, setForm] = useState({ musterId: '', passengerId: '', drillDate: '', attendanceStatus: 'PRESENT' })
  const [busy, setBusy] = useState(false)
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  async function submit(e) {
    e.preventDefault(); setBusy(true)
    try {
      await embarkationService.recordDrill({ musterId: Number(form.musterId), voyageId: Number(voyageId), passengerId: Number(form.passengerId), drillDate: form.drillDate, attendanceStatus: form.attendanceStatus })
      setForm({ musterId: '', passengerId: '', drillDate: '', attendanceStatus: 'PRESENT' }); onDone()
    } catch (e2) { onError(errMsg(e2)) } finally { setBusy(false) }
  }
  return (
    <Form onSubmit={submit} className="cl-card mb-3">
      <div className="cl-form-section-title">Record drill attendance</div>
      <Row className="g-3 align-items-end">
        <Col md={3}><Form.Label>Station</Form.Label><SearchableSelect options={stationOptions} value={form.musterId} onChange={(v) => setField('musterId', v)} placeholder="Station…" required /></Col>
        <Col md={3}><Form.Label>Passenger</Form.Label><SearchableSelect options={passengerOptions} value={form.passengerId} onChange={(v) => setField('passengerId', v)} placeholder="Passenger…" required /></Col>
        <Col md={3}><Form.Label>Date</Form.Label><Form.Control type="date" value={form.drillDate} onChange={(e) => setField('drillDate', e.target.value)} required /></Col>
        <Col md={2}><Form.Label>Attendance</Form.Label>
          <Form.Select value={form.attendanceStatus} onChange={(e) => setField('attendanceStatus', e.target.value)}>
            {ATTENDANCE_STATUS.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
          </Form.Select>
        </Col>
        <Col md={1}><Button type="submit" className="cl-btn-primary w-100" disabled={busy}>Save</Button></Col>
      </Row>
    </Form>
  )
}

function MusterEditModal({ station, voyageId, onClose, onDone, onError }) {
  const [form, setForm] = useState({
    stationCode: station.stationCode || '',
    deck: station.deck || '',
    assignedCabinRange: station.assignedCabinRange || '',
    capacity: station.capacity ?? 2,
  })
  const [busy, setBusy] = useState(false)
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  async function submit(e) {
    e.preventDefault(); setBusy(true)
    try {
      await embarkationService.updateMusterStation(station.musterId, {
        voyageId: Number(voyageId), stationCode: form.stationCode, deck: form.deck,
        assignedCabinRange: form.assignedCabinRange, capacity: Number(form.capacity),
      })
      onDone()
    } catch (e2) { onError(errMsg(e2)) } finally { setBusy(false) }
  }
  return (
    <Modal show onHide={busy ? undefined : onClose} centered>
      <Form onSubmit={submit}>
        <Modal.Header closeButton={!busy}><Modal.Title>Edit muster station #{station.musterId}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col xs={6}><Form.Label>Code</Form.Label><Form.Control value={form.stationCode} onChange={(e) => setField('stationCode', e.target.value)} required /></Col>
            <Col xs={6}><Form.Label>Deck</Form.Label><Form.Control value={form.deck} onChange={(e) => setField('deck', e.target.value)} /></Col>
            <Col xs={8}><Form.Label>Cabin range</Form.Label><Form.Control value={form.assignedCabinRange} onChange={(e) => setField('assignedCabinRange', e.target.value)} placeholder="9000-9050" /></Col>
            <Col xs={4}><Form.Label>Capacity</Form.Label><Form.Control type="number" min={1} value={form.capacity} onChange={(e) => setField('capacity', e.target.value)} required /></Col>
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

function DrillEditModal({ drill, stationOptions, passengerOptions, onClose, onDone, onError }) {
  const [form, setForm] = useState({
    musterId: String(drill.musterId ?? ''),
    drillDate: drill.drillDate || '',
    attendanceStatus: drill.attendanceStatus || 'PRESENT',
  })
  const [busy, setBusy] = useState(false)
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  async function submit(e) {
    e.preventDefault(); setBusy(true)
    try {
      await embarkationService.updateDrill(drill.drillId, {
        musterId: Number(form.musterId), voyageId: Number(drill.voyageId),
        passengerId: Number(drill.passengerId), drillDate: form.drillDate,
        attendanceStatus: form.attendanceStatus,
      })
      onDone()
    } catch (e2) { onError(errMsg(e2)) } finally { setBusy(false) }
  }
  return (
    <Modal show onHide={busy ? undefined : onClose} centered>
      <Form onSubmit={submit}>
        <Modal.Header closeButton={!busy}><Modal.Title>Edit drill record #{drill.drillId}</Modal.Title></Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">Passenger: <strong>{labelFor(passengerOptions, drill.passengerId)}</strong></p>
          <Row className="g-3">
            <Col xs={12}><Form.Label>Station</Form.Label>
              <SearchableSelect options={stationOptions} value={form.musterId} onChange={(v) => setField('musterId', v)} placeholder="Station…" required />
            </Col>
            <Col xs={7}><Form.Label>Date</Form.Label><Form.Control type="date" value={form.drillDate} onChange={(e) => setField('drillDate', e.target.value)} required /></Col>
            <Col xs={5}><Form.Label>Attendance</Form.Label>
              <Form.Select value={form.attendanceStatus} onChange={(e) => setField('attendanceStatus', e.target.value)}>
                {ATTENDANCE_STATUS.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
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
