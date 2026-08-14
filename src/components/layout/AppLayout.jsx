import { Outlet, useLocation } from 'react-router-dom'
import AppNavbar from './AppNavbar.jsx'

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
