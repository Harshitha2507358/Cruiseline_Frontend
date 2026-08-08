import api, { unwrap } from '../client.js'

export const analyticsService = {
  // ADMIN only. Returns { voyageId, occupancyRate, totalRevenue, revenuePerPassenger,
  // excursionUptakeRate, onboardSpendAvg, totalBookings, totalPassengers }.
  // Rates are already percentages (0–100), not fractions.
  voyageReport: (voyageId) => api.get(`/api/analytics/voyage/${voyageId}`).then(unwrap),
}
