import { useNavigate } from 'react-router-dom'
import { Row, Col, Button } from 'react-bootstrap'
import PageHeader from '../../components/ui/PageHeader.jsx'
import StatCard from '../../components/ui/StatCard.jsx'
import DataTable from '../../components/ui/DataTable.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { useApi } from '../../hooks/useApi.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useNotifications } from '../../notifications/NotificationContext.jsx'
import { voyageService } from '../../api/services/voyages.js'
import { excursionService } from '../../api/services/excursions.js'
import { humanize } from '../../constants/enums.js'

// One entry point that composes a different dashboard per role.
export default function StaffDashboard() {
  const { user } = useAuth()
  switch (user?.role) {
    case 'ADMIN': return <AdminDashboard user={user} />
    case 'EMBARKATION_OFFICER': return <EmbarkationDashboard user={user} />
    case 'EXCURSION_COORDINATOR': return <ExcursionDashboard user={user} />
    case 'PURSER': return <PurserDashboard user={user} />
    case 'ONBOARD_AGENT': return <AgentDashboard user={user} />
    default: return <PageHeader title="Dashboard" />
  }
}

function Greeting({ user, subtitle }) {
  return <PageHeader title={`Welcome, ${user?.name || 'there'}`} subtitle={subtitle} />
}

function AdminDashboard({ user }) {
  const navigate = useNavigate()
  const { unreadCount } = useNotifications()
  const { data, loading, error, reload } = useApi(() => voyageService.list({ page: 0, size: 200 }), [])
  const voyages = data?.content || []
  const today = new Date().toISOString().slice(0, 10)
  const open = voyages.filter((v) => v.status === 'OPEN').length
  const sailing = voyages.filter((v) => v.status === 'SAILING').length
  const upcoming = voyages
    .filter((v) => v.departureDate >= today && v.status !== 'CANCELLED')
    .sort((a, b) => a.departureDate.localeCompare(b.departureDate))
    .slice(0, 6)

  const columns = [
    { key: 'voyageName', header: 'Voyage', render: (v) => <span className="fw-semibold">{v.voyageName}</span> },
    { key: 'homePort', header: 'Home port' },
    { key: 'departureDate', header: 'Departs' },
    { key: 'durationNights', header: 'Nights' },
    { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v.status} /> },
  ]

  return (
    <>
      <Greeting user={user} subtitle="What's happening across the CruiseLine system." />
      <Row className="g-3 mb-4">
        <Col sm={6} lg={3}><StatCard icon="bi-water" tone="navy" label="Total voyages" value={voyages.length} to="/staff/voyages" /></Col>
        <Col sm={6} lg={3}><StatCard icon="bi-bag-check" tone="ocean" label="Open for booking" value={open} to="/staff/voyages" /></Col>
        <Col sm={6} lg={3}><StatCard icon="bi-compass" tone="green" label="Currently sailing" value={sailing} /></Col>
        <Col sm={6} lg={3}><StatCard icon="bi-bell" tone="gold" label="Unread notifications" value={unreadCount} to="/staff/notifications" /></Col>
      </Row>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="cl-section-title mb-0">Upcoming voyages</h2>
        <Button variant="link" onClick={() => navigate('/staff/voyages')}>Manage voyages <i className="bi bi-arrow-right" /></Button>
      </div>
      <DataTable
        columns={columns} rows={upcoming} rowKey={(v) => v.voyageId}
        loading={loading} error={error} onRetry={reload}
        onRowClick={(v) => navigate(`/staff/voyages/${v.voyageId}`)}
        empty={{ icon: 'bi-water', title: 'No upcoming voyages' }}
      />
    </>
  )
}

function EmbarkationDashboard({ user }) {
  const navigate = useNavigate()
  return (
    <>
      <Greeting user={user} subtitle="Which passengers need to be processed and embarked?" />
      <div className="cl-card">
        <h2 className="cl-section-title">Passenger embarkation</h2>
        <p className="text-muted">Select a voyage to view its passenger manifest, verify documents, check guests in, assign muster stations, and record drill attendance.</p>
        <Button className="cl-btn-primary" onClick={() => navigate('/staff/embarkation')}>
          <i className="bi bi-door-open me-2" />Open embarkation workspace
        </Button>
      </div>
    </>
  )
}

function ExcursionDashboard({ user }) {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useApi(() => excursionService.list({ page: 0, size: 200 }), [])
  const list = data?.content || []
  const available = list.filter((x) => x.status === 'AVAILABLE').length
  const soldOut = list.filter((x) => x.status === 'SOLD_OUT').length

  return (
    <>
      <Greeting user={user} subtitle="What excursions require management?" />
      <Row className="g-3 mb-4">
        <Col sm={6} lg={3}><StatCard icon="bi-map" tone="ocean" label="Excursions" value={loading ? '…' : list.length} to="/staff/excursions" /></Col>
        <Col sm={6} lg={3}><StatCard icon="bi-check-circle" tone="green" label="Available" value={loading ? '…' : available} /></Col>
        <Col sm={6} lg={3}><StatCard icon="bi-slash-circle" tone="gold" label="Sold out" value={loading ? '…' : soldOut} /></Col>
      </Row>
      {error && <div className="text-danger small mb-2">{error} <button className="btn btn-link btn-sm" onClick={reload}>retry</button></div>}
      <div className="cl-card">
        <h2 className="cl-section-title">Manage excursions</h2>
        <p className="text-muted">Create and edit excursions, build and finalise manifests, and review passenger bookings.</p>
        <Button className="cl-btn-primary" onClick={() => navigate('/staff/excursions')}><i className="bi bi-compass me-2" />Open excursions</Button>
      </div>
    </>
  )
}

function PurserDashboard({ user }) {
  const navigate = useNavigate()
  const { unreadCount } = useNotifications()
  return (
    <>
      <Greeting user={user} subtitle="What onboard accounts and charges require attention?" />
      <Row className="g-3 mb-4">
        <Col sm={6} lg={3}><StatCard icon="bi-credit-card" tone="navy" label="Onboard accounts" value="Manage" to="/staff/accounts" /></Col>
        <Col sm={6} lg={3}><StatCard icon="bi-cash-coin" tone="ocean" label="Booking payments" value="Record" to="/staff/bookings" /></Col>
        <Col sm={6} lg={3}><StatCard icon="bi-bell" tone="gold" label="Unread notifications" value={unreadCount} to="/staff/notifications" /></Col>
      </Row>
      <div className="cl-card">
        <h2 className="cl-section-title">Onboard finances</h2>
        <p className="text-muted">Open and settle passenger folios, reverse charges, and record booking payments.</p>
        <Button className="cl-btn-primary me-2" onClick={() => navigate('/staff/accounts')}><i className="bi bi-credit-card me-2" />Onboard accounts</Button>
        <Button variant="outline-primary" onClick={() => navigate('/staff/bookings')}><i className="bi bi-cash-coin me-2" />Booking payments</Button>
      </div>
    </>
  )
}

function AgentDashboard({ user }) {
  const navigate = useNavigate()
  return (
    <>
      <Greeting user={user} subtitle="What charges do I need to post?" />
      <div className="cl-card">
        <h2 className="cl-section-title">Onboard charges</h2>
        <p className="text-muted">Look up an active onboard account and post charges for dining, bar, spa, retail, and more.</p>
        <Button className="cl-btn-primary" onClick={() => navigate('/staff/accounts')}><i className="bi bi-credit-card me-2" />Open onboard accounts</Button>
      </div>
    </>
  )
}
