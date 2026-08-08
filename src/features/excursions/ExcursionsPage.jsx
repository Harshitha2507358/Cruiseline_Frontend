import { useState } from 'react'
import { Button, Modal, Form, Row, Col, Alert } from 'react-bootstrap'
import PageHeader from '../../components/ui/PageHeader.jsx'
import DataTable from '../../components/ui/DataTable.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import SearchableSelect from '../../components/ui/SearchableSelect.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { useApi } from '../../hooks/useApi.js'
import { useVoyageOptions } from '../../hooks/useOptions.js'
import { useNotifications } from '../../notifications/NotificationContext.jsx'
import { excursionService } from '../../api/services/excursions.js'
import { EXCURSION_CATEGORY, DIFFICULTY_LEVEL, humanize, money } from '../../constants/enums.js'
import { errMsg } from '../../api/client.js'

const emptyForm = { portOfCall: '', excursionName: '', category: 'CULTURAL', durationHours: '', price: '', maxCapacity: 30, difficultyLevel: 'MODERATE' }

export default function ExcursionsPage() {
  const { refresh } = useNotifications()
  const { options: voyageOptions } = useVoyageOptions()
  const excursions = useApi(() => excursionService.list({ page: 0, size: 100 }), [])
  const list = excursions.data?.content || []

  const [q, setQ] = useState('')
  const [modal, setModal] = useState(null) // {mode:'create'|'edit', excursion?}
  const [voyageId, setVoyageId] = useState('')
  const [manifests, setManifests] = useState(null)
  const [manLoading, setManLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const rows = list.filter((x) => !q || `${x.excursionName} ${x.portOfCall}`.toLowerCase().includes(q.trim().toLowerCase()))

  async function loadManifests(vId = voyageId) {
    if (!vId) return
    setManLoading(true); setError('')
    try { setManifests(await excursionService.manifestsByVoyage(vId)) }
    catch (e) { setError(errMsg(e)); setManifests([]) } finally { setManLoading(false) }
  }
  async function finalise(m) {
    try { await excursionService.finaliseManifest(m.manifestId); setNotice('Manifest finalised.'); refresh(); loadManifests() }
    catch (e) { setError(errMsg(e)) }
  }

  const columns = [
    { key: 'excursionId', header: 'ID' },
    { key: 'excursionName', header: 'Excursion', render: (x) => <span className="fw-semibold">{x.excursionName}</span> },
    { key: 'portOfCall', header: 'Port' },
    { key: 'category', header: 'Category', render: (x) => humanize(x.category) },
    { key: 'durationHours', header: 'Duration', render: (x) => (x.durationHours != null ? `${x.durationHours}h` : '—') },
    { key: 'price', header: 'Price', render: (x) => money(x.price) },
    { key: 'capacity', header: 'Booked', render: (x) => `${x.bookedCount}/${x.maxCapacity}` },
    { key: 'status', header: 'Status', render: (x) => <StatusBadge status={x.status} /> },
    { key: 'actions', header: '', className: 'text-end', render: (x) => <Button size="sm" variant="outline-primary" onClick={() => setModal({ mode: 'edit', excursion: x })}>Edit</Button> },
  ]

  return (
    <>
      <PageHeader title="Shore Excursions" subtitle="Manage the excursion catalogue and build voyage manifests."
        actions={<Button className="cl-btn-primary" onClick={() => setModal({ mode: 'create' })}><i className="bi bi-plus-lg me-2" />New excursion</Button>} />

      {notice && <Alert variant="success" dismissible onClose={() => setNotice('')}>{notice}</Alert>}
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <div className="cl-card cl-toolbar">
        <div className="cl-search"><i className="bi bi-search" />
          <Form.Control placeholder="Search by name or port…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <DataTable columns={columns} rows={rows} rowKey={(x) => x.excursionId}
        loading={excursions.loading} error={excursions.error} onRetry={excursions.reload}
        empty={{ icon: 'bi-map', title: 'No excursions yet', message: 'Create one to get started.' }} />

      <h2 className="cl-section-title mt-4">Manifests</h2>
      <div className="cl-card cl-toolbar">
        <div style={{ minWidth: 300, flex: 1 }}>
          <SearchableSelect options={voyageOptions} value={voyageId} onChange={(v) => { setVoyageId(v); setManifests(null) }} placeholder="Select a voyage…" />
        </div>
        <Button className="cl-btn-primary" onClick={() => loadManifests()} disabled={!voyageId}>Load manifests</Button>
        {voyageId && <NewManifestButton voyageId={voyageId} excursionOptions={list.map((x) => ({ value: String(x.excursionId), label: x.excursionName, sublabel: `#${x.excursionId} · ${x.portOfCall}` }))} onDone={() => { setNotice('Manifest created.'); loadManifests() }} onError={setError} />}
      </div>

      {manifests === null
        ? <div className="cl-card"><EmptyState icon="bi-list-check" title="No voyage selected" message="Pick a voyage to view its excursion manifests." /></div>
        : <DataTable
            columns={[
              { key: 'manifestId', header: 'ID' },
              { key: 'excursionId', header: 'Excursion', render: (m) => labelForExcursion(list, m.excursionId) },
              { key: 'portDate', header: 'Port date', render: (m) => m.portDate || '—' },
              { key: 'departureTime', header: 'Departs', render: (m) => m.departureTime || '—' },
              { key: 'meetingPoint', header: 'Meeting point', render: (m) => m.meetingPoint || '—' },
              {
                key: 'booked',
                header: 'Booked',
                render: (m) => {
                  const x = list.find((e) => String(e.excursionId) === String(m.excursionId))
                  return x ? `${x.bookedCount}/${x.maxCapacity}` : (m.totalBooked ?? 0)
                },
              },
              { key: 'status', header: 'Status', render: (m) => <StatusBadge status={m.status} /> },
              { key: 'actions', header: '', className: 'text-end', render: (m) => m.status === 'DRAFT' ? <Button size="sm" className="cl-btn-primary" onClick={() => finalise(m)}>Finalise</Button> : null },
            ]}
            rows={manifests} rowKey={(m) => m.manifestId} loading={manLoading}
            empty={{ icon: 'bi-list-check', title: 'No manifests for this voyage' }}
          />}

      {modal && <ExcursionModal modal={modal} onClose={() => setModal(null)} onDone={() => { setModal(null); excursions.reload() }} />}
    </>
  )
}

function labelForExcursion(list, id) {
  const x = list.find((e) => String(e.excursionId) === String(id))
  return x ? x.excursionName : `#${id}`
}

function NewManifestButton({ voyageId, excursionOptions, onDone, onError }) {
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ excursionId: '', portDate: '', meetingPoint: '', departureTime: '' })
  const [busy, setBusy] = useState(false)
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  async function submit(e) {
    e.preventDefault(); setBusy(true)
    try {
      await excursionService.createManifest({
        excursionId: Number(form.excursionId), voyageId: Number(voyageId),
        portDate: form.portDate || null, meetingPoint: form.meetingPoint || null,
        departureTime: form.departureTime ? `${form.departureTime}:00` : null,
      })
      setShow(false); setForm({ excursionId: '', portDate: '', meetingPoint: '', departureTime: '' }); onDone()
    } catch (e2) { onError(errMsg(e2)) } finally { setBusy(false) }
  }
  return (
    <>
      <Button variant="outline-primary" onClick={() => setShow(true)}><i className="bi bi-plus-lg me-1" />New manifest</Button>
      <Modal show={show} onHide={() => setShow(false)} centered>
        <Form onSubmit={submit}>
          <Modal.Header closeButton><Modal.Title>New manifest</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3"><Form.Label>Excursion</Form.Label>
              <SearchableSelect options={excursionOptions} value={form.excursionId} onChange={(v) => setField('excursionId', v)} placeholder="Select excursion…" required />
            </Form.Group>
            <Row className="g-3">
              <Col md={6}><Form.Label>Port date</Form.Label><Form.Control type="date" value={form.portDate} onChange={(e) => setField('portDate', e.target.value)} /></Col>
              <Col md={6}><Form.Label>Departure time</Form.Label><Form.Control type="time" value={form.departureTime} onChange={(e) => setField('departureTime', e.target.value)} /></Col>
              <Col md={12}><Form.Label>Meeting point</Form.Label><Form.Control value={form.meetingPoint} onChange={(e) => setField('meetingPoint', e.target.value)} placeholder="Gangway Deck 5" /></Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShow(false)} disabled={busy}>Cancel</Button>
            <Button type="submit" className="cl-btn-primary" disabled={busy || !form.excursionId}>{busy ? 'Creating…' : 'Create manifest'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  )
}

function ExcursionModal({ modal, onClose, onDone }) {
  const isEdit = modal.mode === 'edit'
  const [form, setForm] = useState(isEdit ? { ...emptyForm, ...modal.excursion } : emptyForm)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr('')
    const body = {
      portOfCall: form.portOfCall, excursionName: form.excursionName, category: form.category,
      durationHours: form.durationHours === '' ? null : Number(form.durationHours),
      price: Number(form.price), maxCapacity: Number(form.maxCapacity), difficultyLevel: form.difficultyLevel,
    }
    try {
      if (isEdit) await excursionService.update(modal.excursion.excursionId, body)
      else await excursionService.create(body)
      onDone()
    } catch (e2) { setErr(errMsg(e2)) } finally { setBusy(false) }
  }
  return (
    <Modal show onHide={onClose} centered>
      <Form onSubmit={submit}>
        <Modal.Header closeButton><Modal.Title>{isEdit ? 'Edit excursion' : 'New excursion'}</Modal.Title></Modal.Header>
        <Modal.Body>
          {err && <Alert variant="danger">{err}</Alert>}
          <Row className="g-3">
            <Col md={8}><Form.Label>Name</Form.Label><Form.Control value={form.excursionName} onChange={(e) => setField('excursionName', e.target.value)} required /></Col>
            <Col md={4}><Form.Label>Port of call</Form.Label><Form.Control value={form.portOfCall} onChange={(e) => setField('portOfCall', e.target.value)} required /></Col>
            <Col md={6}><Form.Label>Category</Form.Label>
              <Form.Select value={form.category} onChange={(e) => setField('category', e.target.value)}>
                {EXCURSION_CATEGORY.map((c) => <option key={c} value={c}>{humanize(c)}</option>)}
              </Form.Select>
            </Col>
            <Col md={6}><Form.Label>Difficulty</Form.Label>
              <Form.Select value={form.difficultyLevel} onChange={(e) => setField('difficultyLevel', e.target.value)}>
                {DIFFICULTY_LEVEL.map((d) => <option key={d} value={d}>{humanize(d)}</option>)}
              </Form.Select>
            </Col>
            <Col md={4}><Form.Label>Duration (h)</Form.Label><Form.Control type="number" min={0} step="0.5" value={form.durationHours} onChange={(e) => setField('durationHours', e.target.value)} /></Col>
            <Col md={4}><Form.Label>Price</Form.Label><Form.Control type="number" min={0} step="0.01" value={form.price} onChange={(e) => setField('price', e.target.value)} required /></Col>
            <Col md={4}><Form.Label>Max capacity</Form.Label><Form.Control type="number" min={1} value={form.maxCapacity} onChange={(e) => setField('maxCapacity', e.target.value)} required /></Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" className="cl-btn-primary" disabled={busy}>{busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create excursion'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}