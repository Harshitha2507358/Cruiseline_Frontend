# CruiseLine — Frontend

A redesigned React frontend for the CruiseLine Operations & Passenger Management system.
All roles share **one unified interface** — a single top-navigation shell (no sidebar),
fully responsive down to mobile. Passengers and staff see the same chrome; only the
screens and the navigation links differ by role.

- **Passenger** — a clean travel-app: discover → choose → book → pay → manage trip.
- **Staff / Operations** — a role-based operations console (Admin, Embarkation Officer,
  Excursion Coordinator, Purser, Onboard Agent).

## Requirements
- Node 18+
- The CruiseLine backend running behind the gateway (default `http://localhost:8081`),
  with Eureka + all services up.

## Run

```bash
npm install
npm run dev
```

Opens on http://localhost:5173 (or the next free port). The gateway CORS accepts any
localhost origin, so 5173 / 5174 / etc. all work.

Build for production:

```bash
npm run build
npm run preview
```

## Configuration
The backend base URL is configurable — edit `.env`:

```
VITE_API_BASE_URL=http://localhost:8081
```

## How it connects to the backend
- **Auth:** `POST /api/auth/login` → `{ accessToken, refreshToken, userId, name, email, role }`.
  Tokens are stored in `localStorage`; the access token is attached as `Authorization: Bearer …`
  on every request. A 401 triggers a one-shot refresh via `/api/auth/refresh-token`.
- **Password reset:** `POST /api/auth/forgot-password` issues a single-use, 15-minute reset
  code; `POST /api/auth/reset-password` takes the code + new password. Both are public.
- **Envelope:** every response is `{ success, message, data, timestamp }` — the client
  unwraps `.data`. Lists are Spring pages (`{ content, totalPages, … }`).
- **Roles** (single role per user): `PASSENGER, EMBARKATION_OFFICER, ONBOARD_AGENT,
  EXCURSION_COORDINATOR, PURSER, ADMIN`. Self-registration always creates a PASSENGER.
- No fake endpoints or mock data — every call maps to a real backend endpoint.

## Project structure

```
src/
  api/            client.js + services/ (one module per domain)
  auth/           AuthContext, ProtectedRoute (role-aware guards)
  config/         roles.js (capability sets), nav.js (role → navigation)
  components/
    ui/           PageHeader, DataTable, StatusBadge, StatCard, states,
                  ConfirmDialog, SearchableSelect, VoyageCard, BookingCard
    layout/       AppLayout, AppNavbar (one top-nav shell for all roles), ProfileMenu
  hooks/          useApi (loading/error/reload), useOptions (pickers)
  notifications/  NotificationContext (polling, toasts + unread badge)
  constants/      enums.js (values, status→variant, money/humanize helpers)
  features/       auth/ (LoginPage),
                  passenger/ (Home, Explore, VoyageDetail, BookingFlow,
                              MyBookings, Excursions, Profile),
                  dashboard, voyages, bookings, embarkation, excursions,
                  accounts, analytics, users, notifications   (staff screens)
  assets/         images.js (local gradient imagery, no external URLs)
  styles/         theme.css (design system + responsive @media rules)
```

## UI & navigation
One responsive top navbar for **every** role — no sidebar. It collapses to a hamburger
menu below 1200px; links are role-filtered from `config/nav.js`, and the account menu
(name, role, sign out, and Profile for passengers) sits on the right.

- **Passenger:** Home · Explore · My Bookings · Onboard Account · Excursions · Notifications  (+ Profile in the account menu)
- **Admin:** Dashboard · Voyages · Bookings · Embarkation · Excursions · Accounts · Analytics · Notifications · Users
- **Embarkation Officer:** Dashboard · Embarkation (Manifest/Check-in · Muster · Drills — muster & drills are editable) · Notifications
- **Excursion Coordinator:** Dashboard · Excursions (catalogue + manifests) · Notifications
- **Purser:** Dashboard · Accounts · Payments · Notifications
- **Onboard Agent:** Dashboard · Accounts · Notifications

Frontend route guards are UX only — the backend remains the real authority.

## Backend touch-points
This redesign required a few small backend additions (so it is no longer strictly "unchanged"):
- **api-gateway:** CORS widened to any localhost origin (`allowedOriginPatterns`), and the
  two password-reset paths whitelisted.
- **auth-service:** password-reset endpoints (forgot / reset) + reset-token fields on `User`.
- **embarkation-service:** `PUT` endpoints to edit muster stations and drill attendance.
- **All 8 services:** service-layer unit tests (JUnit 5 + Mockito).

## Default admin
Seeded by the backend: `admin@cruiseline.com` / `Admin@12345` (not shown in the UI).
