import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { ToastContainer, Toast } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { notificationService } from '../api/services/notifications.js'

const NotificationContext = createContext(null)
const POLL_MS = 10000 // poll every 10s for the unread badge + new-item toasts

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [toasts, setToasts] = useState([])

  const lastSeenId = useRef(0)
  const primed = useRef(false)

  const poll = useCallback(async () => {
    if (!user) return
    try {
      const count = await notificationService.unreadCount()
      setUnreadCount(Number(count) || 0)

      const page = await notificationService.mine({ page: 0, size: 20 })
      const items = (page?.content || []).slice().sort((a, b) => b.notificationId - a.notificationId)
      const maxId = items.length ? items[0].notificationId : 0

      if (!primed.current) {
        // First poll after login: set a baseline so we don't toast the backlog.
        lastSeenId.current = maxId
        primed.current = true
        return
      }
      if (maxId > lastSeenId.current) {
        const fresh = items.filter((n) => n.notificationId > lastSeenId.current && n.status === 'UNREAD')
        lastSeenId.current = maxId
        if (fresh.length) {
          setToasts((prev) => [
            ...prev,
            ...fresh.map((n) => ({ id: n.notificationId, message: n.message, category: n.category })),
          ])
        }
      }
    } catch { /* swallow — retry next tick */ }
  }, [user])

  useEffect(() => {
    // Reset baseline whenever the signed-in user changes.
    primed.current = false
    lastSeenId.current = 0
    setUnreadCount(0)
    setToasts([])
    if (!user) return
    poll()
    const t = setInterval(poll, POLL_MS)
    return () => clearInterval(t)
  }, [user, poll])

  const refresh = useCallback(() => { poll() }, [poll])
  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <NotificationContext.Provider value={{ unreadCount, refresh }}>
      {children}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1080 }}>
        {toasts.map((t) => (
          <Toast key={t.id} onClose={() => dismissToast(t.id)} autohide delay={7000}
            onClick={() => { dismissToast(t.id); navigate('/notifications') }}
            role="button" style={{ cursor: 'pointer' }}>
            <Toast.Header closeButton>
              <i className="bi bi-bell-fill text-warning me-2"></i>
              <strong className="me-auto">{t.category || 'Notification'}</strong>
            </Toast.Header>
            <Toast.Body>{t.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
