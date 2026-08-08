import { Outlet, useLocation } from 'react-router-dom'
import AppNavbar from './AppNavbar.jsx'

// The single application shell used by every role: top navbar + centered
// content + footer. Passengers and staff get the identical chrome; the router
// decides which pages render inside <Outlet/>.
export default function AppLayout() {
  const location = useLocation()
  return (
    <div className="cl-app">
      <AppNavbar />
      <main className="cl-app-content">
        <div className="cl-page" key={location.pathname}>
          <Outlet />
        </div>
      </main>
      <footer className="cl-app-foot">
        <i className="bi bi-life-preserver me-2" />CruiseLine · © {new Date().getFullYear()}
      </footer>
    </div>
  )
}
