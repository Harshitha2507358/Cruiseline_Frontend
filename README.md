# 🚢 CruiseLine — Operations & Passenger Management System

A full-stack cruise management platform: passengers discover, book and pay for voyages;
staff run the operation (voyages, embarkation, excursions, onboard accounts, analytics).
A **Spring Cloud microservices** backend behind an API gateway, and a **React (Vite)**
single-page frontend with one unified, responsive, role-aware UI.

<p align="left">
  <img src="https://img.shields.io/badge/Java-17-007396?logo=openjdk&logoColor=white" />
  <img src="https://img.shields.io/badge/Spring%20Boot-3.x-6DB33F?logo=springboot&logoColor=white" />
  <img src="https://img.shields.io/badge/Spring%20Cloud-Gateway%20%2B%20Eureka-6DB33F?logo=spring&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white" />
  <img src="https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/Tests-JUnit5%20%2B%20Mockito-25A162?logo=junit5&logoColor=white" />
</p>

---

## ✨ Features

**Passenger**
- Browse voyages, view cabin categories & availability
- 5-step booking wizard (cabin → guest → review → pay → done)
- Manage bookings: pay balance, amend (while tentative), cancel
- Onboard account, shore excursions, notifications, profile

**Staff / Operations** (role-based)
- **Admin** — voyages & cabins, all bookings, users, analytics, everything
- **Embarkation Officer** — manifest & check-in, muster stations, drills (create + edit)
- **Excursion Coordinator** — excursion catalogue & manifests
- **Purser** — onboard accounts & payments
- **Onboard Agent** — onboard accounts

**Platform**
- JWT auth with one-shot refresh; forgot/reset password flow
- Centralized routing + auth at the API gateway; service discovery via Eureka
- One responsive UI shell for every role (no sidebar); mobile-friendly
- Service-layer unit tests across all 8 services

---

## 🏗️ Architecture

```
                    ┌─────────────────────────┐
   Browser  ─────►  │   React SPA (Vite)      │
                    └───────────┬─────────────┘
                                │  HTTPS / JWT
                                ▼
                    ┌─────────────────────────┐
                    │  API Gateway  (:8081)   │  ← validates JWT, CORS, routing
                    └───────────┬─────────────┘
                                │  discovers via
                                ▼
                    ┌─────────────────────────┐
                    │  Eureka Registry (:8761)│
                    └───────────┬─────────────┘
        ┌───────────────┬───────┴───────┬───────────────┐
        ▼               ▼               ▼               ▼
  auth-service    voyage-service   booking-service   embarkation-service
  excursion-service   account-service   analytics-service   notification-service
        │  (each owns its own MySQL schema — database-per-service)
        ▼
   ┌──────────┐
   │  MySQL   │
   └──────────┘
```

- **Gateway** is the single entry point — validates the access token, injects trusted
  `X-User-*` headers, and routes to services by path.
- **Database-per-service** — every service owns its schema; no shared tables.
- Frontend never calls a service directly; everything goes through the gateway.

---

## 🧰 Tech stack

| Layer | Technology |
|---|---|
| Backend | Java 17, Spring Boot, Spring Security (JWT), Spring Data JPA |
| Microservices | Spring Cloud Gateway, Netflix Eureka, OpenFeign |
| Database | MySQL (one schema per service) |
| Frontend | React 18, Vite, React Router, React-Bootstrap, Axios |
| Testing | JUnit 5, Mockito, AssertJ |

---

## 🚀 Getting started

### Prerequisites
- Java 17+ and Maven
- Node 18+
- MySQL running on `localhost:3306` (schemas auto-create on first run)

### 1) Backend — start in this order

```bash
# 1. Service registry
cd discovery-server   && mvn spring-boot:run     # :8761

# 2. API gateway
cd api-gateway        && mvn spring-boot:run     # :8081

# 3. Business services (each in its own terminal)
cd auth-service       && mvn spring-boot:run
cd voyage-service     && mvn spring-boot:run
cd booking-service    && mvn spring-boot:run
cd embarkation-service && mvn spring-boot:run
cd excursion-service  && mvn spring-boot:run
cd account-service    && mvn spring-boot:run
cd analytics-service  && mvn spring-boot:run
cd notification-service && mvn spring-boot:run
```

> Services register with Eureka and are reached only through the gateway on **:8081**.

### 2) Frontend

```bash
cd CruiseLine_Frontend
npm install
npm run dev            # http://localhost:5173
```

Configure the gateway URL in `CruiseLine_Frontend/.env`:

```
VITE_API_BASE_URL=http://localhost:8081
```

### Default admin (seeded by the backend)
```
admin@cruiseline.com  /  Admin@12345
```

---

## 🔐 Authentication flow
1. `POST /api/auth/login` → `{ accessToken, refreshToken, userId, name, email, role }`.
2. Frontend stores tokens in `localStorage`; every request carries `Authorization: Bearer <token>`.
3. The gateway validates the JWT once and forwards trusted identity headers to services.
4. On a `401`, the client silently calls `/api/auth/refresh-token` and replays the request.
5. Forgot password: `POST /api/auth/forgot-password` → single-use, 15-min reset code →
   `POST /api/auth/reset-password`.

All responses use a common envelope: `{ success, message, data, timestamp }`.

---

## 🧪 Testing

Service-layer unit tests (JUnit 5 + Mockito) exist for every service — repositories, Feign
clients and gateways are mocked, so **no database or running services are required**.

```bash
cd <service>   &&   mvn test        # e.g. cd booking-service && mvn test
```

They assert the business rules in isolation (e.g. "a passenger can't check in without a
confirmed booking", payment math, cabin-capacity guards, analytics KPI formulas).

---

## 📁 Repository layout

```
.
├── discovery-server/          # Eureka registry
├── api-gateway/               # Spring Cloud Gateway (routing, CORS, JWT validation)
├── auth-service/              # login, register, JWT, password reset, users
├── voyage-service/            # voyages, cabin categories & cabins
├── booking-service/           # bookings, payments
├── embarkation-service/       # check-in, muster stations, drills
├── excursion-service/         # shore excursions & manifests
├── account-service/           # onboard accounts & charges
├── analytics-service/         # KPIs & reports
├── notification-service/      # notifications
└── CruiseLine_Frontend/       # React (Vite) SPA
    └── src/
        ├── api/               # axios client + one service module per domain
        ├── auth/              # AuthContext, ProtectedRoute (role guards)
        ├── config/            # roles.js (capabilities), nav.js (role → nav)
        ├── components/        # ui/ primitives + layout/ (AppLayout, AppNavbar)
        ├── hooks/             # useApi, useOptions
        ├── notifications/     # NotificationContext (polling + unread badge)
        ├── constants/         # enums, formatters
        ├── features/          # auth/, passenger/, and staff screens
        └── styles/            # theme.css (design system + responsive rules)
```

---

## 🗺️ Roles & navigation
Single role per user: `PASSENGER · EMBARKATION_OFFICER · ONBOARD_AGENT ·
EXCURSION_COORDINATOR · PURSER · ADMIN`. One responsive top navbar for all roles; links
are role-filtered. Self-registration always creates a **PASSENGER**. Frontend route guards
are UX only — the backend (`@PreAuthorize`) is the real authority.

---

## 📄 License
For educational / demonstration use.
