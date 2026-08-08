import { Dropdown } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import { humanize } from '../../constants/enums.js'

function initials(name, email) {
  const base = (name || email || '?').trim()
  const parts = base.split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return base.slice(0, 2).toUpperCase()
}

// Avatar + name + role badge with a dropdown (profile, logout). Used in both shells.
export default function ProfileMenu({ profileTo }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <Dropdown align="end">
      <Dropdown.Toggle as="button" className="cl-profile-toggle">
        <span className="cl-avatar">{initials(user?.name, user?.email)}</span>
        <span className="cl-profile-meta">
          <span className="cl-profile-name">{user?.name || user?.email}</span>
          <span className="cl-profile-role">{humanize(user?.role)}</span>
        </span>
        <i className="bi bi-chevron-down cl-profile-caret" />
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.ItemText className="cl-profile-head">
          <span className="cl-profile-head-name">{user?.name || user?.email}</span>
          <span className="cl-profile-head-role">{humanize(user?.role)}</span>
          {user?.name && <span className="cl-profile-head-email">{user?.email}</span>}
        </Dropdown.ItemText>
        <Dropdown.Divider />
        {profileTo && (
          <Dropdown.Item onClick={() => navigate(profileTo)}>
            <i className="bi bi-person me-2" />Profile
          </Dropdown.Item>
        )}
        <Dropdown.Item onClick={handleLogout}>
          <i className="bi bi-box-arrow-right me-2" />Sign out
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  )
}
