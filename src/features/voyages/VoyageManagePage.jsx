import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Dropdown, Modal, Form, Row, Col, Alert } from 'react-bootstrap'
import PageHeader from '../../components/ui/PageHeader.jsx'
import AsyncSection from '../../components/ui/AsyncSection.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { useApi } from '../../hooks/useApi.js'
import { voyageService } from '../../api/services/voyages.js'
import { VOYAGE_STATUS, CABIN_CATEGORY_NAME, CABIN_LOCATION, humanize, money } from '../../constants/enums.js'
import { errMsg } from '../../api/client.js'

export default function VoyageManagePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const voyage = useApi(() => voyageService.get(id), [id])
  const categories = useApi(() => voyageService.categories(id), [id])
  const v = voyage.data
  const cats = categories.data || []

  const [cabinsByCat, setCabinsByCat] = useState({})
  const [expanded, setExpanded] = useState({})
  const [edit, setEdit] = useState(false)
  const [addCategory, setAddCategory] = useState(false)
  const [addCabinFor, setAddCabinFor] = useState(null)
  const [notice, setNotice] = useState('')

  async function toggleCabins(catId) {
    const isOpen = !expanded[catId]
    setExpanded((e) => ({ ...e, [catId]: isOpen }))
    if (isOpen && !cabinsByCat[catId]) {
      try { const list = await voyageService.cabins(catId); setCabinsByCat((m) => ({ ...m, [catId]: list })) }
      catch (e) { setNotice(errMsg(e)) }
    }
  }
  async function reloadCabins(catId) {
    try { const list = await voyageService.cabins(catId); setCabinsByCat((m) => ({ ...m, [catId]: list })) } catch { /* ignore */ }
  }

  async function changeStatus(status) {
    try { await voyageService.setStatus(id, status); voyage.reload() }
    catch (e) { setNotice(errMsg(e)) }
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Voyages & Cabins', to: '/staff/voyages' }, { label: v?.voyageName || 'Voyage' }]}
        title={v?.voyageName || 'Voyage'}
        actions={
          <>
            <Button variant="outline-secondary" onClick={() => navigate('/staff/voyages')}><i className="bi bi-arrow-left me-1" />Back</Button>
            <Button variant="outline-primary" onClick={() => setEdit(true)} disabled={!v}><i className="bi bi-pencil me-1" />Edit</Button>
            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary" disabled={!v}>Set status</Dropdown.Toggle>
              <Dropdown.Menu>
                {VOYAGE_STATUS.map((s) => <Dropdown.Item key={s} onClick={() => changeStatus(s)}>{humanize(s)}</Dropdown.Item>)}
              </Dropdown.Menu>
            </Dropdown>
          </>
        }
      />

      {notice && <Alert variant="danger" dismissible onClose={() => setNotice('')}>{notice}</Alert>}

      <AsyncSection loading={voyage.loading} error={voyage.error} onRetry={voyage.reload}>
        {v && (
          <Row className="g-4">
            <Col lg={4}>
              <div className="cl-card">
                <div className="d-flex justify-content-between mb-2"><h2 className="cl-section-title mb-0">Details</h2><StatusBadge status={v.status} /></div>
                <div className="py-1"><span className="text-muted">Vessel:</span> <strong>{v.vesselId}</strong></div>
                <div className="py-1"><span className="text-muted">Home port:</span> <strong>{v.homePort}</strong></div>
                <div className="py-1"><span className="text-muted">Departs:</span> <strong>{v.departureDate}</strong></div>
                <div className="py-1"><span className="text-muted">Returns:</span> <strong>{v.returnDate}</strong></div>
                <div className="py-1"><span className="text-muted">Nights:</span> <strong>{v.durationNights}</strong></div>
                <div className="py-1"><span className="text-muted">Route:</span> <strong>{v.portsOfCall || '—'}</strong></div>
              </div>
            </Col>

            <Col lg={8}>
              <div className="cl-card">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="cl-section-title mb-0">Cabin categories</h2>
                  <Button size="sm" className="cl-btn-primary" onClick={() => setAddCategory(true)}><i className="bi bi-plus-lg me-1" />Add category</Button>
                </div>
                <AsyncSection loading={categories.loading} error={categories.error} onRetry={categories.reload}
                  isEmpty={cats.length === 0} empty={{ icon: 'bi-door-closed', title: 'No categories yet' }}>
                  {cats.map((c) => (
                    <div key={c.categoryId} className="border rounded p-3 mb-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <span className="fw-semibold">{humanize(c.categoryName)}</span> <StatusBadge status={c.status} />
                          <div className="text-muted small">Deck {c.deck || '—'} · {c.beddingConfig || '—'} · sleeps {c.maxOccupancy} · {money(c.basePrice)} · {c.availableCabins}/{c.totalCabins} available</div>
                        </div>
                        <div className="d-flex gap-2">
                          <Button size="sm" variant="outline-secondary" onClick={() => toggleCabins(c.categoryId)}>
                            {expanded[c.categoryId] ? 'Hide' : 'View'} cabins
                          </Button>
                          <Button size="sm" variant="outline-primary" onClick={() => setAddCabinFor(c)}>Add cabin</Button>
                        </div>
                      </div>
                      {expanded[c.categoryId] && (
                        <div className="mt-2">
                          {(cabinsByCat[c.categoryId] || []).length === 0
                            ? <div className="text-muted small">No cabins in this category.</div>
                            : (
                              <table className="table table-sm mb-0 mt-2">
                                <thead><tr><th>Cabin</th><th>Deck</th><th>Location</th><th>Status</th></tr></thead>
                                <tbody>
                                  {(cabinsByCat[c.categoryId] || []).map((cab) => (
                                    <tr key={cab.cabinId}><td>{cab.cabinNumber}</td><td>{cab.deck || '—'}</td><td>{humanize(cab.location)}</td><td><StatusBadge status={cab.status} /></td></tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                        </div>
                      )}
                    </div>
                  ))}
                </AsyncSection>
              </div>
            </Col>
          </Row>
        )}
      </AsyncSection>

      {edit && v && <EditVoyageModal voyage={v} onClose={() => setEdit(false)} onDone={() => { setEdit(false); voyage.reload() }} />}
      {addCategory && <AddCategoryModal voyageId={id} onClose={() => setAddCategory(false)} onDone={() => { setAddCategory(false); categories.reload() }} />}
      {addCabinFor && <AddCabinModal category={addCabinFor} onClose={() => setAddCabinFor(null)}
        onDone={() => { const c = addCabinFor; setAddCabinFor(null); categories.reload(); reloadCabins(c.categoryId) }} />}
    </>
  )
}

function EditVoyageModal({ voyage, onClose, onDone }) {
  const [form, setForm] = useState({ ...voyage })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      await voyageService.update(voyage.voyageId, {
        voyageName: form.voyageName, vesselId: form.vesselId, homePort: form.homePort,
        departureDate: form.departureDate, returnDate: form.returnDate,
        durationNights: Number(form.durationNights), portsOfCall: form.portsOfCall, status: form.status,
      })
      onDone()
    } catch (e2) { setErr(errMsg(e2)) } finally { setBusy(false) }
  }
  return (
    <Modal show onHide={onClose} centered size="lg">
      <Form onSubmit={submit}>
        <Modal.Header closeButton><Modal.Title>Edit voyage</Modal.Title></Modal.Header>
        <Modal.Body>
          {err && <Alert variant="danger">{err}</Alert>}
          <Row className="g-3">
            <Col md={8}><Form.Label>Voyage name</Form.Label><Form.Control value={form.voyageName} onChange={(e) => setField('voyageName', e.target.value)} required /></Col>
            <Col md={4}><Form.Label>Vessel ID</Form.Label><Form.Control value={form.vesselId} onChange={(e) => setField('vesselId', e.target.value)} required /></Col>
            <Col md={6}><Form.Label>Home port</Form.Label><Form.Control value={form.homePort} onChange={(e) => setField('homePort', e.target.value)} required /></Col>
            <Col md={3}><Form.Label>Departure</Form.Label><Form.Control type="date" value={form.departureDate} onChange={(e) => setField('departureDate', e.target.value)} required /></Col>
            <Col md={3}><Form.Label>Return</Form.Label><Form.Control type="date" value={form.returnDate} onChange={(e) => setField('returnDate', e.target.value)} required /></Col>
            <Col md={3}><Form.Label>Nights</Form.Label><Form.Control type="number" min={1} value={form.durationNights} onChange={(e) => setField('durationNights', e.target.value)} required /></Col>
            <Col md={9}><Form.Label>Ports of call</Form.Label><Form.Control value={form.portsOfCall || ''} onChange={(e) => setField('portsOfCall', e.target.value)} /></Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" className="cl-btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

function AddCategoryModal({ voyageId, onClose, onDone }) {
  const [form, setForm] = useState({ categoryName: 'BALCONY', deck: '', beddingConfig: '', maxOccupancy: 2, basePrice: '', totalCabins: 1 })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      await voyageService.createCategory({
        voyageId: Number(voyageId), categoryName: form.categoryName, deck: form.deck, beddingConfig: form.beddingConfig,
        maxOccupancy: Number(form.maxOccupancy), basePrice: Number(form.basePrice), totalCabins: Number(form.totalCabins),
      })
      onDone()
    } catch (e2) { setErr(errMsg(e2)) } finally { setBusy(false) }
  }
  return (
    <Modal show onHide={onClose} centered>
      <Form onSubmit={submit}>
        <Modal.Header closeButton><Modal.Title>Add cabin category</Modal.Title></Modal.Header>
        <Modal.Body>
          {err && <Alert variant="danger">{err}</Alert>}
          <Row className="g-3">
            <Col md={6}><Form.Label>Category</Form.Label>
              <Form.Select value={form.categoryName} onChange={(e) => setField('categoryName', e.target.value)}>
                {CABIN_CATEGORY_NAME.map((c) => <option key={c} value={c}>{humanize(c)}</option>)}
              </Form.Select>
            </Col>
            <Col md={6}><Form.Label>Deck</Form.Label><Form.Control value={form.deck} onChange={(e) => setField('deck', e.target.value)} /></Col>
            <Col md={6}><Form.Label>Bedding</Form.Label><Form.Control value={form.beddingConfig} onChange={(e) => setField('beddingConfig', e.target.value)} placeholder="Queen + Sofa" /></Col>
            <Col md={6}><Form.Label>Max occupancy</Form.Label><Form.Control type="number" min={1} value={form.maxOccupancy} onChange={(e) => setField('maxOccupancy', e.target.value)} required /></Col>
            <Col md={6}><Form.Label>Base price</Form.Label><Form.Control type="number" min={0} step="0.01" value={form.basePrice} onChange={(e) => setField('basePrice', e.target.value)} required /></Col>
            <Col md={6}><Form.Label>Total cabins</Form.Label><Form.Control type="number" min={0} value={form.totalCabins} onChange={(e) => setField('totalCabins', e.target.value)} required /></Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" className="cl-btn-primary" disabled={busy}>{busy ? 'Adding…' : 'Add category'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

function AddCabinModal({ category, onClose, onDone }) {
  const [form, setForm] = useState({ cabinNumber: '', deck: category.deck || '', location: 'MIDSHIP' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      await voyageService.createCabin({ categoryId: Number(category.categoryId), cabinNumber: form.cabinNumber, deck: form.deck, location: form.location })
      onDone()
    } catch (e2) { setErr(errMsg(e2)) } finally { setBusy(false) }
  }
  return (
    <Modal show onHide={onClose} centered>
      <Form onSubmit={submit}>
        <Modal.Header closeButton><Modal.Title>Add cabin — {humanize(category.categoryName)}</Modal.Title></Modal.Header>
        <Modal.Body>
          {err && <Alert variant="danger">{err}</Alert>}
          <Row className="g-3">
            <Col md={6}><Form.Label>Cabin number</Form.Label><Form.Control value={form.cabinNumber} onChange={(e) => setField('cabinNumber', e.target.value)} required /></Col>
            <Col md={6}><Form.Label>Deck</Form.Label><Form.Control value={form.deck} onChange={(e) => setField('deck', e.target.value)} /></Col>
            <Col md={12}><Form.Label>Location</Form.Label>
              <Form.Select value={form.location} onChange={(e) => setField('location', e.target.value)}>
                {CABIN_LOCATION.map((l) => <option key={l} value={l}>{humanize(l)}</option>)}
              </Form.Select>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" className="cl-btn-primary" disabled={busy}>{busy ? 'Adding…' : 'Add cabin'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
