import { useState } from 'react'
import { Button, Modal, Form, Alert } from 'react-bootstrap'
import PageHeader from '../../components/ui/PageHeader.jsx'
import DataTable from '../../components/ui/DataTable.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import SearchableSelect from '../../components/ui/SearchableSelect.jsx'
import { useApi } from '../../hooks/useApi.js'
import { useUserOptions } from '../../hooks/useOptions.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useNotifications } from '../../notifications/NotificationContext.jsx'
import { can } from '../../config/roles.js'
import { notificationService } from '../../api/services/notifications.js'
import { NOTIFICATION_CATEGORY, humanize } from '../../constants/enums.js'
import { errMsg } from '../../api/client.js'

export default function NotificationsPage() {
  const { user } = useAuth()
  const { refresh } = useNotifications()
  const canSend = can(user?.role, 'SEND_NOTIFICATION')

  const { data, loading, error, reload } = useApi(() => notificationService.mine({ page: 0, size: 50 }), [])
  const rows = data?.content || []

  const { options: userOptions } = useUserOptions(canSend)
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ userId: '', category: 'BOOKING', message: '' })
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')

  async function act(fn) {
    try { await fn(); reload(); refresh() } catch (e) { alert(errMsg(e)) }
  }

  async function submitSend(e) {
    e.preventDefault()
    setBusy(true); setFormError('')
    try {
      await notificationService.send({ userId: Number(form.userId), category: form.category, message: form.message })
      setShow(false)
      setForm({ userId: '', category: 'BOOKING', message: '' })
      reload(); refresh()
    } catch (err) {
      setFormError(errMsg(err))
    } finally { setBusy(false) }
  }

  const columns = [
    { key: 'message', header: 'Message', render: (n) => n.message },
    { key: 'category', header: 'Category', render: (n) => <StatusBadge status={n.category} /> },
    { key: 'status', header: 'Status', render: (n) => <StatusBadge status={n.status} /> },
    { key: 'createdDate', header: 'Received', render: (n) => n.createdDate ? new Date(n.createdDate).toLocaleString() : '—' },
    {
      key: 'actions', header: '', className: 'text-end', render: (n) => (
        <>
          {n.status !== 'READ' && n.status !== 'DISMISSED' && (
            <Button size="sm" variant="outline-primary" onClick={() => act(() => notificationService.markRead(n.notificationId))}>Read</Button>
          )}
          {n.status !== 'DISMISSED' && (
            <Button size="sm" variant="outline-secondary" onClick={() => act(() => notificationService.dismiss(n.notificationId))}>Dismiss</Button>
          )}
        </>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Your in-app notifications."
        actions={canSend && <Button className="cl-btn-primary" onClick={() => setShow(true)}><i className="bi bi-send me-2" />Send notification</Button>}
      />

      <DataTable
        columns={columns} rows={rows} rowKey={(n) => n.notificationId}
        loading={loading} error={error} onRetry={reload}
        empty={{ icon: 'bi-bell', title: 'No notifications', message: 'You are all caught up.' }}
      />

      <Modal show={show} onHide={() => setShow(false)} centered>
        <Form onSubmit={submitSend}>
          <Modal.Header closeButton><Modal.Title>Send notification</Modal.Title></Modal.Header>
          <Modal.Body>
            {formError && <Alert variant="danger">{formError}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Recipient</Form.Label>
              <SearchableSelect options={userOptions} value={form.userId}
                onChange={(v) => setForm({ ...form, userId: v })} placeholder="Select a user…" required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {NOTIFICATION_CATEGORY.map((c) => <option key={c} value={c}>{humanize(c)}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Message</Form.Label>
              <Form.Control as="textarea" rows={3} value={form.message} required
                onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShow(false)} disabled={busy}>Cancel</Button>
            <Button type="submit" className="cl-btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Send'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  )
}
