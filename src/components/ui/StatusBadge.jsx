import { Badge } from 'react-bootstrap'
import { statusVariant, humanize } from '../../constants/enums.js'

// One consistent status pill everywhere. Colour is derived centrally from the value.
export default function StatusBadge({ status, className }) {
  if (!status) return <span className="text-muted">—</span>
  return (
    <Badge bg={statusVariant(status)} className={className}>
      {humanize(status)}
    </Badge>
  )
}
