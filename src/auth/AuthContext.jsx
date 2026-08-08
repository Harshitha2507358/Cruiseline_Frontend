import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { Modal, Button } from 'react-bootstrap'
import { authService } from '../api/services/auth.js'

const AuthContext = createContext(null)

// Idle auto-logout: sign out after 15 min of inactivity, warn 60s before.
const IDLE_LIMIT_MS = 15 * 60 * 1000
const WARN_BEFORE_MS = 60 * 1000

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(Math.round(WARN_BEFORE_MS / 1000))

  const warnTimer = useRef(null)
  const logoutTimer = useRef(null)
  const countdownTimer = useRef(null)
  const warningRef = useRef(false)
  const userRef = useRef(null)

  // Restore session from localStorage on first load.
  useEffect(() => {
    const stored = localStorage.getItem('cl_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { /* ignore malformed */ }
    }
    setReady(true)
  }, [])

  async function login(email, password) {
    const data = await authService.login(email, password)
    localStorage.setItem('cl_access_token', data.accessToken)
    localStorage.setItem('cl_refresh_token', data.refreshToken)
    const u = { userId: data.userId, name: data.name, email: data.email, role: data.role }
    localStorage.setItem('cl_user', JSON.stringify(u))
    setUser(u)
    return u
  }

  const logout = useCallback(() => {
    localStorage.removeItem('cl_access_token')
    localStorage.removeItem('cl_refresh_token')
    localStorage.removeItem('cl_user')
    setUser(null)
  }, [])

  // ---- Idle auto-logout -----------------------------------------------------
  const clearTimers = useCallback(() => {
    clearTimeout(warnTimer.current)
    clearTimeout(logoutTimer.current)
    clearInterval(countdownTimer.current)
    warnTimer.current = logoutTimer.current = countdownTimer.current = null
  }, [])

  const armTimers = useCallback(() => {
    clearTimers()
    setShowWarning(false)
    warningRef.current = false
    warnTimer.current = setTimeout(() => {
      setShowWarning(true)
      warningRef.current = true
      setCountdown(Math.round(WARN_BEFORE_MS / 1000))
      countdownTimer.current = setInterval(() => setCountdown((c) => (c > 1 ? c - 1 : 0)), 1000)
    }, Math.max(0, IDLE_LIMIT_MS - WARN_BEFORE_MS))
    logoutTimer.current = setTimeout(() => {
      clearTimers()
      warningRef.current = false
      setShowWarning(false)
      logout()
    }, IDLE_LIMIT_MS)
  }, [clearTimers, logout])

  useEffect(() => { userRef.current = user }, [user])

  useEffect(() => {
    if (!user) { clearTimers(); setShowWarning(false); warningRef.current = false; return }
    armTimers()
    const onActivity = () => {
      if (!userRef.current) return
      if (!warningRef.current) armTimers()
    }
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }))
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity))
      clearTimers()
    }
  }, [user, armTimers, clearTimers])

  const staySignedIn = () => armTimers()
  // ---------------------------------------------------------------------------

  const value = {
    user,
    ready,
    login,
    logout,
    isAuthenticated: !!user,
    isPassenger: user?.role === 'PASSENGER',
    isStaff: !!user && user.role !== 'PASSENGER',
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      <Modal show={showWarning && !!user} onHide={staySignedIn} centered backdrop="static">
        <Modal.Header><Modal.Title>Session expiring</Modal.Title></Modal.Header>
        <Modal.Body>
          You've been inactive for a while. For security, you'll be signed out in{' '}
          <strong>{countdown}</strong> second{countdown === 1 ? '' : 's'}.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={logout}>Sign out now</Button>
          <Button className="cl-btn-primary" onClick={staySignedIn}>Stay signed in</Button>
        </Modal.Footer>
      </Modal>
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
