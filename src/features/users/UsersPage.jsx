import { useState } from 'react'
import { Button, Modal, Form, Row, Col, Alert } from 'react-bootstrap'
import PageHeader from '../../components/ui/PageHeader.jsx'
import DataTable from '../../components/ui/DataTable.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { useApi } from '../../hooks/useApi.js'
import { userService } from '../../api/services/users.js'
import { ROLES, humanize } from '../../constants/enums.js'
import { errMsg } from '../../api/client.js'

const emptyForm = { name: '', email: '', password: '', phone: '', role: 'PASSENGER', vesselId: '' }

export default function UsersPage() {
  const [role, setRole] = useState('')
  const [q, setQ] = useState('')
  const { data, loading, error, reload } = useApi(() => userService.list({ page: 0, size: 200, role: role || undefined }), [role])
  const all = data?.content || []
  const rows = all.filter((u) => !q || `${u.name} ${u.email}`.toLowerCase().includes(q.trim().toLowerCase()))

  const [show, setShow] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function toggleStatus(u) {
    try { await userService.setStatus(u.userId, u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'); reload() }
    catch (e) { alert(errMsg(e)) }
  }

  async function submit(e) {
    e.preventDefault(); setBusy(true); setFormError('')
    try {
      await userService.create({ ...form, phone: form.phone || null, vesselId: form.vesselId || null })
      setShow(false); setForm(emptyForm); reload()
    } catch (err) { setFormError(errMsg(err)) } finally { setBusy(false) }
  }

  const columns = [
    { key: 'userId', header: 'ID' },
    { key: 'name', header: 'Name', render: (u) => <span className="fw-semibold">{u.name}</span> },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone', render: (u) => u.phone || '—' },
    { key: 'role', header: 'Role', render: (u) => <StatusBadge status={u.role === 'ADMIN' ? 'ACTIVE' : u.role} />, },
    { key: 'vesselId', header: 'Vessel', render: (u) => u.vesselId || '—' },
    { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status} /> },
    {
      key: 'actions', header: '', className: 'text-end', render: (u) => (
        <Button size="sm" variant={u.status === 'ACTIVE' ? 'outline-danger' : 'outline-success'} onClick={() => toggleStatus(u)}>
          {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Users" subtitle="Manage staff and passenger accounts."
        actions={<Button className="cl-btn-primary" onClick={() => { setFormError(''); setShow(true) }}><i className="bi bi-person-plus me-2" />Add user</Button>} />

      <div className="cl-card cl-toolbar">
        <div className="cl-search"><i className="bi bi-search" />
          <Form.Control placeholder="Search by name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Form.Select style={{ maxWidth: 230 }} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{humanize(r)}</option>)}
        </Form.Select>
      </div>

      <DataTable columns={columns} rows={rows} rowKey={(u) => u.userId}
        loading={loading} error={error} onRetry={reload}
        empty={{ icon: 'bi-people', title: 'No users found' }} />

      <Modal show={show} onHide={() => setShow(false)} centered>
        <Form onSubmit={submit}>
          <Modal.Header closeButton><Modal.Title>Add user</Modal.Title></Modal.Header>
          <Modal.Body>
            {formError && <Alert variant="danger">{formError}</Alert>}
            <Row className="g-3">
              <Col md={12}><Form.Label>Name</Form.Label><Form.Control value={form.name} onChange={(e) => setField('name', e.target.value)} required /></Col>
              <Col md={6}><Form.Label>Email</Form.Label><Form.Control type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} required /></Col>
              <Col md={6}><Form.Label>Phone</Form.Label><Form.Control value={form.phone} onChange={(e) => setField('phone', e.target.value)} /></Col>
              <Col md={6}><Form.Label>Password</Form.Label><Form.Control type="password" minLength={8} value={form.password} onChange={(e) => setField('password', e.target.value)} required /></Col>
              <Col md={6}><Form.Label>Role</Form.Label>
                <Form.Select value={form.role} onChange={(e) => setField('role', e.target.value)}>
                  {ROLES.map((r) => <option key={r} value={r}>{humanize(r)}</option>)}
                </Form.Select>
              </Col>
              <Col md={12}><Form.Label>Vessel ID <span className="text-muted">(crew only)</span></Form.Label><Form.Control value={form.vesselId} onChange={(e) => setField('vesselId', e.target.value)} /></Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShow(false)} disabled={busy}>Cancel</Button>
            <Button type="submit" className="cl-btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create user'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  )
}
