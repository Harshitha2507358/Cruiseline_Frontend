import PageHeader from '../../components/ui/PageHeader.jsx'
import AsyncSection from '../../components/ui/AsyncSection.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { useApi } from '../../hooks/useApi.js'
import { authService } from '../../api/services/auth.js'
import { humanize } from '../../constants/enums.js'

function Row({ label, value }) {
  return (
    <div className="d-flex justify-content-between py-2 border-bottom">
      <span className="text-muted">{label}</span>
      <span className="fw-semibold">{value || '—'}</span>
    </div>
  )
}

export default function ProfilePage() {
  const { data, loading, error, reload } = useApi(() => authService.me(), [])

  return (
    <>
      <PageHeader title="My Profile" subtitle="Your account details." />
      <AsyncSection loading={loading} error={error} onRetry={reload}>
        {data && (
          <div className="cl-card" style={{ maxWidth: 560 }}>
            <Row label="Name" value={data.name} />
            <Row label="Email" value={data.email} />
            <Row label="Phone" value={data.phone} />
            <Row label="Role" value={humanize(data.role)} />
            <div className="d-flex justify-content-between py-2">
              <span className="text-muted">Status</span>
              <StatusBadge status={data.status} />
            </div>
          </div>
        )}
      </AsyncSection>
    </>
  )
}
