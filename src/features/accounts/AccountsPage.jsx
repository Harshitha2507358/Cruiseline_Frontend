import { useState, useEffect } from 'react'
import { Button, Modal, Form, Row, Col, Alert } from 'react-bootstrap'
import PageHeader from '../../components/ui/PageHeader.jsx'
import DataTable from '../../components/ui/DataTable.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import SearchableSelect from '../../components/ui/SearchableSelect.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import { useVoyageOptions, usePassengerOptions, labelFor } from '../../hooks/useOptions.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useNotifications } from '../../notifications/NotificationContext.jsx'
import { can } from '../../config/roles.js'
import { accountService } from '../../api/services/accounts.js'
import { CHARGE_TYPE, PAYMENT_MODE, humanize, money } from '../../constants/enums.js'
import { errMsg } from '../../api/client.js'

export default function AccountsPage() {
  const { user } = useAuth()
  const { refresh } = useNotifications()
  const canOpenSettle = can(user?.role, 'OPEN_SETTLE_ACCOUNT')
  const canPost = can(user?.role, 'POST_CHARGE')
  const isPassenger = user?.role === 'PASSENGER'

  // Passengers never load the staff directory (so no 403).
  const { options: voyageOptions } = useVoyageOptions()
  const { options: passengerOptions } = usePassengerOptions(!isPassenger)

  const [accountId, setAccountId] = useState('')
  const [account, setAccount] = useState(null)
  const [charges, setCharges] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Staff lookup + passenger self-view state
  const [lookupPax, setLookupPax] = useState('')
  const [lookupVoyage, setLookupVoyage] = useState('')
  const [myAccounts, setMyAccounts] = useState(null) // null = not-loaded/errored, [] = genuinely none

  const [openModal, setOpenModal] = useState(false)
  const [chargeModal, setChargeModal] = useState(false)
  const [settleModal, setSettleModal] = useState(false)
  const [reverse, setReverse] = useState(null)
  const [busy, setBusy] = useState(false)

  async function load(id = accountId) {
    if (!id) return
    setLoading(true); setError(''); setNotice('')
    try {
      const [acc, ch] = await Promise.all([accountService.get(id), accountService.charges(id)])
      setAccount(acc); setCharges(ch || []); setAccountId(String(id))
    } catch (e) { setError(errMsg(e)); setAccount(null) } finally { setLoading(false) }
  }
  function flash(msg) { setNotice(msg); refresh(); load() }

  // Passenger: auto-load THEIR OWN account(s) via /api/accounts/me.
  useEffect(() => {
    if (!isPassenger) return
    accountService.myAccounts()
      .then((list) => {
        const accts = list || []
        setMyAccounts(accts)
        if (accts.length === 1) load(accts[0].accountId)
      })
      .catch((e) => { setMyAccounts(null); setError(errMsg(e)) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPassenger])

  // Staff: find the account for a chosen passenger + voyage, then load it.
  async function lookupByPassengerVoyage() {
    if (!lookupPax || !lookupVoyage) return
    setError(''); setNotice('')
    try {
      const acc = await accountService.lookup(Number(lookupPax), Number(lookupVoyage))
      load(acc.accountId)
    } catch (e) {
      setAccount(null); setCharges([])
      setError(errMsg(e, 'No account found for that passenger on that voyage.'))
    }
  }

  const isActive = account?.status === 'ACTIVE'

  const columns = [
    { key: 'chargeId', header: 'ID' },
    { key: 'chargeType', header: 'Type', render: (c) => humanize(c.chargeType) },
    { key: 'description', header: 'Description', render: (c) => c.description || '—' },
    { key: 'amount', header: 'Amount', render: (c) => money(c.amount) },
    { key: 'postedDateTime', header: 'Posted', render: (c) => c.postedDateTime ? new Date(c.postedDateTime).toLocaleString() : '—' },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
    {
      key: 'actions', header: '', className: 'text-end', render: (c) => (
        canOpenSettle && isActive && c.status !== 'REVERSED'
          ? <Button size="sm" variant="outline-danger" onClick={() => setReverse(c)}>Reverse</Button>
          : null
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Onboard Accounts"
        subtitle={isPassenger ? 'Your onboard folio and charges.' : 'Open and settle passenger folios, post and reverse charges.'}
        actions={canOpenSettle && <Button className="cl-btn-primary" onClick={() => { setError(''); setOpenModal(true) }}><i className="bi bi-plus-lg me-2" />Open account</Button>}
      />

      {notice && <Alert variant="success" dismissible onClose={() => setNotice('')}>{notice}</Alert>}
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* STAFF: find an account by passenger + voyage */}
      {!isPassenger && (
        <div className="cl-card mb-3">
          <div className="cl-form-section-title">Find an account by passenger</div>
          <Row className="g-2 align-items-end">
            <Col md={5}>
              <Form.Label className="small text-muted mb-1">Passenger</Form.Label>
              <SearchableSelect options={passengerOptions} value={lookupPax} onChange={setLookupPax} placeholder="Select a passenger…" />
            </Col>
            <Col md={5}>
              <Form.Label className="small text-muted mb-1">Voyage</Form.Label>
              <SearchableSelect options={voyageOptions} value={lookupVoyage} onChange={setLookupVoyage} placeholder="Select a voyage…" />
            </Col>
            <Col md={2}>
              <Button className="cl-btn-primary w-100" disabled={!lookupPax || !lookupVoyage || loading} onClick={lookupByPassengerVoyage}>Load</Button>
            </Col>
          </Row>
          <Form.Text className="text-muted">An account exists per passenger per voyage.</Form.Text>
        </div>
      )}

      {/* PASSENGER: their own account(s) */}
      {isPassenger && (
        <div className="cl-card mb-3">
          <div className="cl-form-section-title">My onboard account{(myAccounts?.length ?? 0) !== 1 ? 's' : ''}</div>
          {myAccounts?.length === 0 && (
            <div className="text-muted">You don't have an onboard account yet. One is opened by the ship's purser.</div>
          )}
          {myAccounts?.length > 1 && (
            <div style={{ maxWidth: 420 }}>
              <SearchableSelect
                options={myAccounts.map((a) => ({ value: String(a.accountId), label: labelFor(voyageOptions, a.voyageId), sublabel: `Account #${a.accountId}` }))}
                value={accountId}
                onChange={(v) => load(v)}
                placeholder="Choose a voyage…"
              />
            </div>
          )}
          {myAccounts?.length >= 1 && <Form.Text className="text-muted">Showing your onboard folio and charges below.</Form.Text>}
        </div>
      )}

      {account ? (
        <>
          <div className="cl-card mb-3">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
              <div>
                <h2 className="cl-section-title mb-1">Account #{account.accountId}</h2>
                <div className="text-muted">
                  {!isPassenger && <>Passenger: {labelFor(passengerOptions, account.passengerId)} · </>}
                  Voyage: {labelFor(voyageOptions, account.voyageId)}
                </div>
              </div>
              <StatusBadge status={account.status} />
            </div>
            <Row className="g-3 mt-1">
              <Col sm={4}><div className="cl-kv-label">Credit limit</div><div className="cl-kv-value">{money(account.creditLimit)}</div></Col>
              <Col sm={4}><div className="cl-kv-label">Current balance</div><div className="cl-kv-value">{money(account.currentBalance)}</div></Col>
              <Col sm={4} className="d-flex align-items-end gap-2">
                {canPost && isActive && <Button size="sm" className="cl-btn-primary" onClick={() => { setError(''); setChargeModal(true) }}>Post charge</Button>}
                {canOpenSettle && isActive && <Button size="sm" variant="outline-primary" onClick={() => { setError(''); setSettleModal(true) }}>Settle folio</Button>}
              </Col>
            </Row>
            {!isActive && <div className="text-muted small mt-2">This folio is {humanize(account.status).toLowerCase()} — no further charges or settlements.</div>}
          </div>

          <DataTable columns={columns} rows={charges} rowKey={(c) => c.chargeId} loading={loading}
            empty={{ icon: 'bi-receipt', title: 'No charges posted yet' }} />
        </>
      ) : (
        !isPassenger && <div className="cl-card"><EmptyState icon="bi-credit-card" title="No account loaded" message="Find an account by passenger and voyage, or open a new one." /></div>
      )}

      {openModal && <OpenAccountModal passengerOptions={passengerOptions} voyageOptions={voyageOptions}
        onClose={() => setOpenModal(false)} onDone={(acc) => { setOpenModal(false); setNotice(`Account #${acc.accountId} opened.`); load(acc.accountId) }} />}
      {chargeModal && account && <ChargeModal accountId={account.accountId} onClose={() => setChargeModal(false)} onDone={() => { setChargeModal(false); flash('Charge posted.') }} />}
      {settleModal && account && <SettleModal accountId={account.accountId} onClose={() => setSettleModal(false)} onDone={() => { setSettleModal(false); flash('Folio settled.') }} />}

      <ConfirmDialog show={!!reverse} title="Reverse charge?"
        body={reverse && <>Reverse the {humanize(reverse.chargeType)} charge of {money(reverse.amount)}?</>}
        confirmLabel="Reverse charge" busy={busy}
        onCancel={() => setReverse(null)}
        onConfirm={async () => {
          setBusy(true)
          try { await accountService.reverseCharge(reverse.chargeId); setReverse(null); flash('Charge reversed.') }
          catch (e) { setError(errMsg(e)) } finally { setBusy(false) }
        }} />
    </>
  )
}

function OpenAccountModal({ passengerOptions, voyageOptions, onClose, onDone }) {
  const [form, setForm] = useState({ passengerId: '', voyageId: '', creditLimit: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      const acc = await accountService.open({ passengerId: Number(form.passengerId), voyageId: Number(form.voyageId), creditLimit: Number(form.creditLimit) })
      onDone(acc)
    } catch (e2) { setErr(errMsg(e2)) } finally { setBusy(false) }
  }
  return (
    <Modal show onHide={onClose} centered>
      <Form onSubmit={submit}>
        <Modal.Header closeButton><Modal.Title>Open onboard account</Modal.Title></Modal.Header>
        <Modal.Body>
          {err && <Alert variant="danger">{err}</Alert>}
          <Form.Group className="mb-3"><Form.Label>Passenger</Form.Label>
            <SearchableSelect options={passengerOptions} value={form.passengerId} onChange={(v) => setField('passengerId', v)} placeholder="Select passenger…" required />
          </Form.Group>
          <Form.Group className="mb-3"><Form.Label>Voyage</Form.Label>
            <SearchableSelect options={voyageOptions} value={form.voyageId} onChange={(v) => setField('voyageId', v)} placeholder="Select voyage…" required />
          </Form.Group>
          <Form.Group><Form.Label>Credit limit</Form.Label>
            <Form.Control type="number" min={0} step="0.01" value={form.creditLimit} onChange={(e) => setField('creditLimit', e.target.value)} required />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" className="cl-btn-primary" disabled={busy || !form.passengerId || !form.voyageId}>{busy ? 'Opening…' : 'Open account'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

function ChargeModal({ accountId, onClose, onDone }) {
  const [form, setForm] = useState({ chargeType: 'DINING', description: '', amount: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      await accountService.postCharge({ accountId: Number(accountId), chargeType: form.chargeType, description: form.description || null, amount: Number(form.amount) })
      onDone()
    } catch (e2) { setErr(errMsg(e2)) } finally { setBusy(false) }
  }
  return (
    <Modal show onHide={onClose} centered>
      <Form onSubmit={submit}>
        <Modal.Header closeButton><Modal.Title>Post charge</Modal.Title></Modal.Header>
        <Modal.Body>
          {err && <Alert variant="danger">{err}</Alert>}
          <Row className="g-3">
            <Col md={6}><Form.Label>Type</Form.Label>
              <Form.Select value={form.chargeType} onChange={(e) => setField('chargeType', e.target.value)}>
                {CHARGE_TYPE.map((c) => <option key={c} value={c}>{humanize(c)}</option>)}
              </Form.Select>
            </Col>
            <Col md={6}><Form.Label>Amount</Form.Label><Form.Control type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setField('amount', e.target.value)} required /></Col>
            <Col md={12}><Form.Label>Description</Form.Label><Form.Control value={form.description} onChange={(e) => setField('description', e.target.value)} /></Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" className="cl-btn-primary" disabled={busy}>{busy ? 'Posting…' : 'Post charge'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

function SettleModal({ accountId, onClose, onDone }) {
  const [paymentMode, setPaymentMode] = useState('CREDIT_CARD')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr('')
    try { await accountService.settle({ accountId: Number(accountId), paymentMode }); onDone() }
    catch (e2) { setErr(errMsg(e2)) } finally { setBusy(false) }
  }
  return (
    <Modal show onHide={onClose} centered>
      <Form onSubmit={submit}>
        <Modal.Header closeButton><Modal.Title>Settle folio</Modal.Title></Modal.Header>
        <Modal.Body>
          {err && <Alert variant="danger">{err}</Alert>}
          <Form.Label>Payment mode</Form.Label>
          <Form.Select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
            {PAYMENT_MODE.map((m) => <option key={m} value={m}>{humanize(m)}</option>)}
          </Form.Select>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" className="cl-btn-primary" disabled={busy}>{busy ? 'Settling…' : 'Settle folio'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}