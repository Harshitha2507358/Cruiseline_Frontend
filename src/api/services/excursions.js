import api, { unwrap } from '../client.js'

export const excursionService = {
  list: ({ page = 0, size = 50, portOfCall } = {}) =>
    api.get('/api/excursions', { params: { page, size, portOfCall: portOfCall || undefined } }).then(unwrap),
  get: (id) => api.get(`/api/excursions/${id}`).then(unwrap),
  // Manage: EXCURSION_COORDINATOR / ADMIN.
  create: (body) => api.post('/api/excursions', body).then(unwrap),
  update: (id, body) => api.put(`/api/excursions/${id}`, body).then(unwrap),

  // Bookings. Booking requires a non-cancelled cabin booking on the voyage.
  bookingsByPassenger: (passengerId, { page = 0, size = 50 } = {}) =>
    api.get(`/api/excursions/bookings/passenger/${passengerId}`, { params: { page, size } }).then(unwrap),
  // body: { excursionId, passengerId, voyageId }
  book: (body) => api.post('/api/excursions/bookings', body).then(unwrap),
  cancelBooking: (bookingId) => api.delete(`/api/excursions/bookings/${bookingId}`).then(unwrap),

  // Manifests: EXCURSION_COORDINATOR / ADMIN.
  manifestsByVoyage: (voyageId) => api.get(`/api/excursions/manifests/voyage/${voyageId}`).then(unwrap),
  // body: { excursionId, voyageId, portDate, meetingPoint, departureTime }
  createManifest: (body) => api.post('/api/excursions/manifests', body).then(unwrap),
  finaliseManifest: (manifestId) =>
    api.patch(`/api/excursions/manifests/${manifestId}/finalise`).then(unwrap),
}
