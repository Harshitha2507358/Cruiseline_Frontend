import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute.jsx'

import LoginPage from './features/auth/LoginPage.jsx'

// One shell for every role (no separate passenger/staff chrome, no sidebar)
import AppLayout from './components/layout/AppLayout.jsx'

// Passenger pages
import PassengerHome from './features/passenger/PassengerHome.jsx'
import ExploreVoyages from './features/passenger/ExploreVoyages.jsx'
import PassengerVoyageDetail from './features/passenger/PassengerVoyageDetail.jsx'
import BookingFlow from './features/passenger/BookingFlow.jsx'
import MyBookings from './features/passenger/MyBookings.jsx'
import PassengerExcursions from './features/passenger/PassengerExcursions.jsx'
import ProfilePage from './features/passenger/ProfilePage.jsx'

// Staff pages
import StaffDashboard from './features/dashboard/StaffDashboard.jsx'
import VoyagesPage from './features/voyages/VoyagesPage.jsx'
import VoyageManagePage from './features/voyages/VoyageManagePage.jsx'
import BookingsPage from './features/bookings/BookingsPage.jsx'
import EmbarkationPage from './features/embarkation/EmbarkationPage.jsx'
import ExcursionsPage from './features/excursions/ExcursionsPage.jsx'
import AccountsPage from './features/accounts/AccountsPage.jsx'
import AnalyticsPage from './features/analytics/AnalyticsPage.jsx'
import UsersPage from './features/users/UsersPage.jsx'

// Shared
import NotificationsPage from './features/notifications/NotificationsPage.jsx'

const STAFF = ['ADMIN', 'EMBARKATION_OFFICER', 'EXCURSION_COORDINATOR', 'PURSER', 'ONBOARD_AGENT']

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* ---------------- Passenger experience ---------------- */}
      <Route element={
        <ProtectedRoute roles={['PASSENGER']} redirectTo="/staff"><AppLayout /></ProtectedRoute>
      }>
        <Route path="/" element={<PassengerHome />} />
        <Route path="/explore" element={<ExploreVoyages />} />
        <Route path="/voyages/:id" element={<PassengerVoyageDetail />} />
        <Route path="/book/:voyageId" element={<BookingFlow />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/excursions" element={<PassengerExcursions />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* ---------------- Staff / operations experience ---------------- */}
      <Route path="/staff" element={
        <ProtectedRoute roles={STAFF} redirectTo="/"><AppLayout /></ProtectedRoute>
      }>
        <Route index element={<StaffDashboard />} />
        <Route path="voyages" element={<ProtectedRoute roles={['ADMIN']} redirectTo="/staff"><VoyagesPage /></ProtectedRoute>} />
        <Route path="voyages/:id" element={<ProtectedRoute roles={['ADMIN']} redirectTo="/staff"><VoyageManagePage /></ProtectedRoute>} />
        <Route path="bookings" element={<ProtectedRoute roles={['ADMIN', 'PURSER']} redirectTo="/staff"><BookingsPage /></ProtectedRoute>} />
        <Route path="embarkation" element={<ProtectedRoute roles={['ADMIN', 'EMBARKATION_OFFICER']} redirectTo="/staff"><EmbarkationPage /></ProtectedRoute>} />
        <Route path="excursions" element={<ProtectedRoute roles={['ADMIN', 'EXCURSION_COORDINATOR']} redirectTo="/staff"><ExcursionsPage /></ProtectedRoute>} />
        <Route path="accounts" element={<ProtectedRoute roles={['ADMIN', 'PURSER', 'ONBOARD_AGENT']} redirectTo="/staff"><AccountsPage /></ProtectedRoute>} />
        <Route path="analytics" element={<ProtectedRoute roles={['ADMIN']} redirectTo="/staff"><AnalyticsPage /></ProtectedRoute>} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="users" element={<ProtectedRoute roles={['ADMIN']} redirectTo="/staff"><UsersPage /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}