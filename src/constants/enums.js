// Enum values mirror the backend exactly (source of truth). Do not add values the
// backend doesn't define.

export const ROLES = ['PASSENGER', 'EMBARKATION_OFFICER', 'ONBOARD_AGENT', 'EXCURSION_COORDINATOR', 'PURSER', 'ADMIN']
export const USER_STATUS = ['ACTIVE', 'INACTIVE']
export const VOYAGE_STATUS = ['PLANNING', 'OPEN', 'SAILING', 'COMPLETED', 'CANCELLED']
export const CABIN_CATEGORY_NAME = ['INSIDE', 'OCEAN_VIEW', 'BALCONY', 'SUITE', 'VILLA']
export const CABIN_LOCATION = ['FORWARD', 'MIDSHIP', 'AFT']
export const CABIN_STATUS = ['AVAILABLE', 'OCCUPIED', 'BLOCKED', 'MAINTENANCE']
export const BOOKING_STATUS = ['TENTATIVE', 'CONFIRMED', 'CANCELLED', 'COMPLETED']
export const EMBARKATION_STATUS = ['CHECKED_IN', 'ONBOARD', 'NO_SHOW']
export const ATTENDANCE_STATUS = ['PRESENT', 'ABSENT', 'EXCUSED_MEDICAL']
export const EXCURSION_CATEGORY = ['CULTURAL', 'ADVENTURE', 'CULINARY', 'SCENIC', 'SHOPPING']
export const DIFFICULTY_LEVEL = ['EASY', 'MODERATE', 'STRENUOUS']
export const EXCURSION_STATUS = ['AVAILABLE', 'SOLD_OUT', 'CANCELLED']
export const CHARGE_TYPE = ['DINING', 'BAR', 'SPA', 'SHORE_EXCURSION', 'RETAIL', 'INTERNET', 'MEDICAL']
export const PAYMENT_MODE = ['CREDIT_CARD', 'CASH', 'ROOM_CREDIT']
export const NOTIFICATION_CATEGORY = ['BOOKING', 'EMBARKATION', 'EXCURSION', 'ONBOARD', 'ACCOUNT']

// Bootstrap badge variant for any status string (case-insensitive).
const VARIANTS = {
  success: ['ACTIVE', 'CONFIRMED', 'COMPLETED', 'PRESENT', 'OPEN', 'AVAILABLE', 'SETTLED', 'ONBOARD', 'FINALISED', 'POSTED'],
  info: ['PLANNING', 'TENTATIVE', 'PENDING', 'SAILING', 'BOOKED', 'DRAFT'],
  danger: ['INACTIVE', 'CANCELLED', 'ABSENT', 'REVERSED', 'SOLD_OUT'],
  warning: ['EXCUSED_MEDICAL', 'CHECKED_IN', 'DISPUTED', 'PARTIALLY_SETTLED', 'REFUNDED'],
}

export function statusVariant(status) {
  if (!status) return 'secondary'
  const s = String(status).toUpperCase()
  for (const [variant, values] of Object.entries(VARIANTS)) {
    if (values.includes(s)) return variant
  }
  return 'secondary'
}

// Turn an ENUM_VALUE into a readable label, e.g. OCEAN_VIEW -> "Ocean View".
export function humanize(value) {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// Format a number as USD. Accepts strings (BigDecimal comes over as string/number).
export function money(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return '—'
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}
