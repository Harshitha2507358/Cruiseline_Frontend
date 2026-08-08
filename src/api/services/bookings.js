import api, { unwrap } from '../client.js'

export const bookingService = {
  // Current passenger's bookings (paged).
  mine: ({ page = 0, size = 50 } = {}) =>
    api.get('/api/bookings/me', { params: { page, size } }).then(unwrap),
  // Staff view: all bookings on a voyage (ADMIN/PURSER/EMBARKATION_OFFICER/ONBOARD_AGENT).
  byVoyage: (voyageId, { page = 0, size = 50 } = {}) =>
    api.get(`/api/bookings/voyage/${voyageId}`, { params: { page, size } }).then(unwrap),
  get: (id) => api.get(`/api/bookings/${id}`).then(unwrap),
  // body: { voyageId, cabinId, paxCount, diningPreference, passengers: [ {...lead} ] }
  create: (body) => api.post('/api/bookings', body).then(unwrap),
  // Records a payment; balance 0 -> booking CONFIRMED.
  pay: (id, amount) => api.post(`/api/bookings/${id}/payments`, { amount }).then(unwrap),
  // Amend only while TENTATIVE. body: { cabinId, paxCount, diningPreference }
  amend: (id, body) => api.patch(`/api/bookings/${id}`, body).then(unwrap),
  cancel: (id) => api.delete(`/api/bookings/${id}`).then(unwrap),
}
