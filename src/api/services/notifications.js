import api, { unwrap } from '../client.js'

export const notificationService = {
  // Current user's notifications (paged); optional status filter.
  mine: ({ page = 0, size = 50, status } = {}) =>
    api.get('/api/notifications/me', { params: { page, size, status: status || undefined } }).then(unwrap),
  unreadCount: () => api.get('/api/notifications/me/unread-count').then(unwrap),
  markRead: (id) => api.patch(`/api/notifications/${id}/read`).then(unwrap),
  dismiss: (id) => api.patch(`/api/notifications/${id}/dismiss`).then(unwrap),
  // Staff send. body: { userId, message, category }
  send: (body) => api.post('/api/notifications', body).then(unwrap),
}
