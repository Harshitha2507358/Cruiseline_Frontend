import axios from 'axios'

// Everything talks to the API gateway. Configurable via .env (VITE_API_BASE_URL).
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach the JWT access token to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cl_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On a 401, try the refresh-token flow ONCE, then replay the original request.
// A single in-flight refresh is shared across concurrent 401s.
let refreshing = null
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const refreshToken = localStorage.getItem('cl_refresh_token')

    if (status === 401 && refreshToken && original && !original._retried) {
      original._retried = true
      try {
        if (!refreshing) {
          refreshing = axios.post(`${BASE_URL}/api/auth/refresh-token`, { refreshToken })
        }
        const resp = await refreshing
        refreshing = null
        const data = resp.data?.data
        if (data?.accessToken) {
          localStorage.setItem('cl_access_token', data.accessToken)
          if (data.refreshToken) localStorage.setItem('cl_refresh_token', data.refreshToken)
          original.headers.Authorization = `Bearer ${data.accessToken}`
          return api(original)
        }
      } catch {
        refreshing = null
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Extract a user-facing message from a backend error envelope.
export function errMsg(error, fallback = 'Something went wrong') {
  const d = error?.response?.data
  if (d?.message) return d.message
  if (d?.fieldErrors) return Object.values(d.fieldErrors).join(', ')
  return error?.message || fallback
}

// The backend wraps every payload as { success, message, data, timestamp }.
export function unwrap(res) {
  return res?.data?.data
}

export default api
