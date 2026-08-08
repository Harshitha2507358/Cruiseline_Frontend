import api, { unwrap } from '../client.js'

// All embarkation endpoints require EMBARKATION_OFFICER or ADMIN.
export const embarkationService = {
  musterStations: (voyageId) =>
    api.get(`/api/embarkation/voyages/${voyageId}/muster-stations`).then(unwrap),
  createMusterStation: (body) => api.post('/api/embarkation/muster-stations', body).then(unwrap),
  updateMusterStation: (musterId, body) => api.put(`/api/embarkation/muster-stations/${musterId}`, body).then(unwrap),

  // The manifest / check-in queue for a voyage (optional status filter). Paged.
  queue: (voyageId, { status, page = 0, size = 100 } = {}) =>
    api.get(`/api/embarkation/voyages/${voyageId}/queue`, {
      params: { status: status || undefined, page, size },
    }).then(unwrap),

  // body: { passengerId, voyageId, documentVerified, musterStationId? }
  checkIn: (body) => api.post('/api/embarkation/check-in', body).then(unwrap),
  markOnboard: (recordId) => api.patch(`/api/embarkation/records/${recordId}/onboard`).then(unwrap),

  drills: (voyageId) => api.get(`/api/embarkation/voyages/${voyageId}/drills`).then(unwrap),
  // body: { musterId, voyageId, passengerId, drillDate, attendanceStatus }
  recordDrill: (body) => api.post('/api/embarkation/drills', body).then(unwrap),
  updateDrill: (drillId, body) => api.put(`/api/embarkation/drills/${drillId}`, body).then(unwrap),
}
