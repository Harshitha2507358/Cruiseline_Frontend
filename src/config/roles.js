// Centralized capability sets mirroring backend @PreAuthorize rules, so role
// checks live in ONE place instead of being duplicated across components.

export const CAP = {
  // Voyages & cabins
  MANAGE_VOYAGES: ['ADMIN'],
  // Bookings
  CREATE_BOOKING: ['PASSENGER', 'ADMIN'],
  AMEND_CANCEL_BOOKING: ['PASSENGER', 'ADMIN'], // ownership also enforced server-side
  PAY_BOOKING: ['PASSENGER', 'PURSER', 'ADMIN'],
  VIEW_BOOKINGS_BY_VOYAGE: ['ADMIN', 'PURSER', 'EMBARKATION_OFFICER', 'ONBOARD_AGENT'],
  // Embarkation
  EMBARKATION: ['EMBARKATION_OFFICER', 'ADMIN'],
  // Excursions
  MANAGE_EXCURSIONS: ['EXCURSION_COORDINATOR', 'ADMIN'],
  BOOK_EXCURSION: ['PASSENGER', 'EXCURSION_COORDINATOR', 'ADMIN'],
  // Onboard accounts
  OPEN_SETTLE_ACCOUNT: ['PURSER', 'ADMIN'],
  POST_CHARGE: ['PURSER', 'ONBOARD_AGENT', 'ADMIN'],
  VIEW_ACCOUNT: ['PURSER', 'ONBOARD_AGENT', 'ADMIN'],
  // Notifications
  SEND_NOTIFICATION: ['ADMIN', 'PURSER', 'EMBARKATION_OFFICER', 'ONBOARD_AGENT', 'EXCURSION_COORDINATOR'],
  // Analytics & users
  ANALYTICS: ['ADMIN'],
  MANAGE_USERS: ['ADMIN'],
}

export function can(role, capability) {
  const allowed = CAP[capability]
  return !!role && Array.isArray(allowed) && allowed.includes(role)
}
