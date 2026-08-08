import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Button } from 'react-bootstrap'
import PageHeader from '../../components/ui/PageHeader.jsx'
import VoyageCard from '../../components/ui/VoyageCard.jsx'
import AsyncSection from '../../components/ui/AsyncSection.jsx'
import { useApi } from '../../hooks/useApi.js'
import { voyageService } from '../../api/services/voyages.js'
import { VOYAGE_STATUS, humanize } from '../../constants/enums.js'

export default function ExploreVoyages() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useApi(() => voyageService.list({ page: 0, size: 100 }), [])
  const all = data?.content || []

  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return all.filter((v) => {
      const matchesText = !needle ||
        `${v.voyageName} ${v.homePort} ${v.portsOfCall || ''}`.toLowerCase().includes(needle)
      const matchesStatus = !status || v.status === status
      return matchesText && matchesStatus
    })
  }, [all, q, status])

  const reset = () => { setQ(''); setStatus('') }

  return (
    <>
      <PageHeader title="Explore Voyages" subtitle="Find your next cruise by destination, port, or date." />

      <div className="cl-card cl-toolbar">
        <div className="cl-search">
          <i className="bi bi-search" />
          <Form.Control placeholder="Search by name, home port, or destination…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Form.Select style={{ maxWidth: 200 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {VOYAGE_STATUS.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
        </Form.Select>
        {(q || status) && <Button variant="outline-secondary" onClick={reset}>Reset</Button>}
      </div>

      <AsyncSection
        loading={loading} error={error} onRetry={reload}
        isEmpty={filtered.length === 0}
        empty={{ icon: 'bi-search', title: 'No voyages match', message: 'Try a different search or reset the filters.' }}
      >
        <div className="cl-voyage-grid">
          {filtered.map((v) => (
            <VoyageCard key={v.voyageId} voyage={v} ctaLabel="View & book"
              onView={(x) => navigate(`/voyages/${x.voyageId}`)} />
          ))}
        </div>
      </AsyncSection>
    </>
  )
}
