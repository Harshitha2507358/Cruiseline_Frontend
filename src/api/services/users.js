import api, { unwrap } from '../client.js'

export const userService = {
  // ADMIN only. Paged: { content, page, size, totalElements, totalPages, last }
  list: ({ page = 0, size = 10, role } = {}) =>
    api.get('/api/users', { params: { page, size, role: role || undefined } }).then(unwrap),
  // ADMIN only. body: { name, email, password, phone, role, vesselId }
  create: (body) => api.post('/api/users', body).then(unwrap),
  // ADMIN only. status: 'ACTIVE' | 'INACTIVE'
  setStatus: (userId, status) => api.patch(`/api/users/${userId}/status`, { status }).then(unwrap),
  // Staff-accessible picker feed (all roles or filtered by role).
  directory: ({ role, page = 0, size = 200 } = {}) =>
    api.get('/api/users/directory', { params: { role: role || undefined, page, size } }).then(unwrap),
}
