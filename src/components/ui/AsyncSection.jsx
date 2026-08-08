import LoadingState from './LoadingState.jsx'
import ErrorState from './ErrorState.jsx'
import EmptyState from './EmptyState.jsx'

// Renders the right state for an async section: loading -> error -> empty -> content.
export default function AsyncSection({ loading, error, onRetry, isEmpty, empty, children }) {
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={onRetry} />
  if (isEmpty) return <EmptyState {...(empty || {})} />
  return children
}
