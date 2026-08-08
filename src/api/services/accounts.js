import api, { unwrap } from '../client.js'

export const accountService = {
  get: (id) => api.get(`/api/accounts/${id}`).then(unwrap),
  charges: (id) => api.get(`/api/accounts/${id}/charges`).then(unwrap),
  // Current passenger's own account(s) — id comes from the JWT server-side.
  myAccounts: () => api.get('/api/accounts/me').then(unwrap),
  // Staff: find an account by passenger + voyage.
  lookup: (passengerId, voyageId) =>
    api.get('/api/accounts/lookup', { params: { passengerId, voyageId } }).then(unwrap),
  open: (body) => api.post('/api/accounts', body).then(unwrap),
  postCharge: (body) => api.post('/api/accounts/charges', body).then(unwrap),
  reverseCharge: (chargeId) => api.patch(`/api/accounts/charges/${chargeId}/reverse`).then(unwrap),
  settle: (body) => api.post('/api/accounts/settlements', body).then(unwrap),
}