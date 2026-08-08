// Single source of truth for navigation. Every role — passengers and staff —
// shares ONE top navbar shell; only the links differ. Add a screen here, not
// in a layout. `navFor(role)` returns the links that role should see.

const PASSENGER_NAV = [
  { to: '/', label: 'Home', icon: 'bi-house', end: true },
  { to: '/explore', label: 'Explore', icon: 'bi-compass' },
  { to: '/my-bookings', label: 'My Bookings', icon: 'bi-journal-bookmark' },
  { to: '/accounts', label: 'Onboard Account', icon: 'bi-credit-card' },
  { to: '/excursions', label: 'Excursions', icon: 'bi-map' },
  { to: '/notifications', label: 'Notifications', icon: 'bi-bell' },
]

const STAFF_NAV = [
  { to: '/staff', label: 'Dashboard', icon: 'bi-speedometer2', end: true, roles: ['ADMIN', 'EMBARKATION_OFFICER', 'EXCURSION_COORDINATOR', 'PURSER', 'ONBOARD_AGENT'] },
  { to: '/staff/voyages', label: 'Voyages', icon: 'bi-water', roles: ['ADMIN'] },
  { to: '/staff/bookings', label: 'Bookings', icon: 'bi-journal-bookmark', roles: ['ADMIN'] },
  { to: '/staff/bookings', label: 'Payments', icon: 'bi-cash-coin', roles: ['PURSER'] },
  { to: '/staff/embarkation', label: 'Embarkation', icon: 'bi-door-open', roles: ['ADMIN', 'EMBARKATION_OFFICER'] },
  { to: '/staff/excursions', label: 'Excursions', icon: 'bi-compass', roles: ['ADMIN', 'EXCURSION_COORDINATOR'] },
  { to: '/staff/accounts', label: 'Accounts', icon: 'bi-credit-card', roles: ['ADMIN', 'PURSER', 'ONBOARD_AGENT'] },
  { to: '/staff/analytics', label: 'Analytics', icon: 'bi-graph-up', roles: ['ADMIN'] },
  { to: '/staff/notifications', label: 'Notifications', icon: 'bi-bell', roles: ['ADMIN', 'EMBARKATION_OFFICER', 'EXCURSION_COORDINATOR', 'PURSER', 'ONBOARD_AGENT'] },
  { to: '/staff/users', label: 'Users', icon: 'bi-people', roles: ['ADMIN'] },
]

// The one navigation helper the shell uses. Passengers get their set; every
// staff role gets the STAFF_NAV entries their role is allowed to see.
export function navFor(role) {
  if (!role) return []
  if (role === 'PASSENGER') return PASSENGER_NAV
  return STAFF_NAV.filter((n) => n.roles.includes(role))
}

// The route a role calls "home" — used by the brand link and post-login redirect.
export function homeFor(role) {
  return role === 'PASSENGER' ? '/' : '/staff'
}

// Passengers get a personal profile page; staff don't. The navbar uses this to
// decide whether to show the "Profile" item in the account menu.
export function profileToFor(role) {
  return role === 'PASSENGER' ? '/profile' : null
}
