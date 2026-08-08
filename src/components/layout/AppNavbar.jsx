import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import { navFor, homeFor, profileToFor } from '../../config/nav.js'
import { useNotifications } from '../../notifications/NotificationContext.jsx'
import ProfileMenu from './ProfileMenu.jsx'

// One top navbar for every role. Passengers and staff share the exact same
// shell — only the links (from navFor) differ. Collapses to a slide-down menu
// on phones/tablets; no sidebar anywhere.
export default function AppNavbar() {
  const location = useLocation()
  const { user } = useAuth()
  const { unreadCount } = useNotifications()
  const [open, setOpen] = useState(false)

  const role = user?.role
  const items = navFor(role)
  const home = homeFor(role)
  const profileTo = profileToFor(role)

  // Close the mobile menu whenever the route changes.
  useEffect(() => { setOpen(false) }, [location.pathname])

  return (
    <header className="cl-nav">
      <div className="cl-nav-inner">
        <NavLink to={home} className="cl-nav-brand" end>
          <i className="bi bi-life-preserver" />CruiseLine
        </NavLink>

        <button type="button" className="cl-nav-toggle" aria-label="Toggle menu"
          aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <i className={`bi ${open ? 'bi-x-lg' : 'bi-list'}`} />
        </button>

        <nav className={`cl-nav-menu${open ? ' cl-nav-menu--open' : ''}`}>
          <div className="cl-nav-links">
            {items.map((n) => (
              <NavLink key={`${n.to}-${n.label}`} to={n.to} end={n.end} className="cl-nav-item">
                <i className={`bi ${n.icon}`} />
                <span>{n.label}</span>
                {n.icon === 'bi-bell' && unreadCount > 0 && (
                  <span className="cl-nav-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </NavLink>
            ))}
          </div>
          <div className="cl-nav-account">
            <ProfileMenu profileTo={profileTo} />
          </div>
        </nav>
      </div>
    </header>
  )
}
