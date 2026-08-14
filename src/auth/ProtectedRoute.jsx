import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'


export default function ProtectedRoute({ children, roles, redirectTo = '/' }) {
  const { user, ready } = useAuth()
  const location = useLocation()

  if (!ready) return null // wait for session restore to avoid a flash of /login
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={redirectTo} replace />
  return children
}
