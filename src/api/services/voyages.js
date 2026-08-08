import api, { unwrap } from '../client.js'

export const voyageService = {
  // Paged list. Optional status filter; sort e.g. 'departureDate,asc'.
  list: ({ page = 0, size = 10, status, sort } = {}) =>
    api.get('/api/voyages', { params: { page, size, status: status || undefined, sort } }).then(unwrap),
  get: (id) => api.get(`/api/voyages/${id}`).then(unwrap),
  create: (body) => api.post('/api/voyages', body).then(unwrap),
  update: (id, body) => api.put(`/api/voyages/${id}`, body).then(unwrap),
  setStatus: (id, status) => api.patch(`/api/voyages/${id}/status`, { status }).then(unwrap),

  categories: (voyageId) => api.get(`/api/voyages/${voyageId}/categories`).then(unwrap),
  createCategory: (body) => api.post('/api/voyages/categories', body).then(unwrap),

  cabins: (categoryId) => api.get(`/api/voyages/categories/${categoryId}/cabins`).then(unwrap),
  createCabin: (body) => api.post('/api/voyages/cabins', body).then(unwrap),
}
