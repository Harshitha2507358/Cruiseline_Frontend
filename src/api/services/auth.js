import api, { unwrap } from '../client.js'

export const authService = {
  // data: { accessToken, refreshToken, tokenType, expiresInMs, userId, name, email, role }
  login: (email, password) => api.post('/api/auth/login', { email, password }).then(unwrap),
  // Self-registration is always created as PASSENGER by the backend.
  register: (body) => api.post('/api/auth/register', body).then(unwrap),
  // Request a reset code. Returns { resetToken, expiresInMinutes }. (No mail
  // server in this project, so the code comes back in the response.)
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }).then(unwrap),
  // Set a new password with a valid reset code.
  resetPassword: (token, newPassword) => api.post('/api/auth/reset-password', { token, newPassword }).then(unwrap),
  // Full current-user profile: { userId, name, email, phone, role, vesselId, status }
  me: () => api.get('/api/users/me').then(unwrap),
}
