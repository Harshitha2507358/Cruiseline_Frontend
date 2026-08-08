import { useState } from 'react'
import { Button, Row, Col, Alert } from 'react-bootstrap'
import PageHeader from '../../components/ui/PageHeader.jsx'
import StatCard from '../../components/ui/StatCard.jsx'
import SearchableSelect from '../../components/ui/SearchableSelect.jsx'
import LoadingState from '../../components/ui/LoadingState.jsx'
import { useVoyageOptions } from '../../hooks/useOptions.js'
import { analyticsService } from '../../api/services/analytics.js'
import { money } from '../../constants/enums.js'
import { errMsg } from '../../api/client.js'

const pct = (n) => `${Number(n ?? 0).toFixed(1)}%`

export default function AnalyticsPage() {
  const { options: voyageOptions } = useVoyageOptions()
  const [voyageId, setVoyageId] = useState('')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function run() {
    if (!voyageId) return
    setLoading(true); setError(''); setReport(null)
    try { setReport(await analyticsService.voyageReport(voyageId)) }
    catch (e) { setError(errMsg(e)) } finally { setLoading(false) }
  }

  return (
    <>
      <PageHeader title="Analytics" subtitle="Occupancy, revenue, and excursion uptake for a voyage." />

      <div className="cl-card cl-toolbar">
        <div style={{ minWidth: 300, flex: 1 }}>
          <SearchableSelect options={voyageOptions} value={voyageId} onChange={setVoyageId} placeholder="Select a voyage…" />
        </div>
        <Button className="cl-btn-primary" onClick={run} disabled={!voyageId || loading}>
          <i className="bi bi-graph-up me-2" />Run report
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {loading && <div className="cl-card"><LoadingState label="Building report…" /></div>}

      {report && !loading && (
        <Row className="g-3">
          <Col sm={6} lg={3}><StatCard icon="bi-pie-chart" tone="navy" label="Occupancy rate" value={pct(report.occupancyRate)} /></Col>
          <Col sm={6} lg={3}><StatCard icon="bi-journal-bookmark" tone="ocean" label="Total bookings" value={report.totalBookings ?? 0} /></Col>
          <Col sm={6} lg={3}><StatCard icon="bi-people" tone="ocean" label="Total passengers" value={report.totalPassengers ?? 0} /></Col>
          <Col sm={6} lg={3}><StatCard icon="bi-compass" tone="gold" label="Excursion uptake" value={pct(report.excursionUptakeRate)} /></Col>
          <Col sm={6} lg={3}><StatCard icon="bi-cash-stack" tone="green" label="Total revenue" value={money(report.totalRevenue)} /></Col>
          <Col sm={6} lg={3}><StatCard icon="bi-cash" tone="green" label="Revenue / passenger" value={money(report.revenuePerPassenger)} /></Col>
          <Col sm={6} lg={3}><StatCard icon="bi-credit-card" tone="navy" label="Avg onboard spend" value={money(report.onboardSpendAvg)} /></Col>
        </Row>
      )}
    </>
  )
}
