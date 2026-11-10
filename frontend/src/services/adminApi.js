const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000/api').replace(/\/+$/, '')

export const ADMIN_TOKEN_KEY = 'campus_admin_token'
export const ADMIN_PROFILE_KEY = 'campus_admin_profile'

export function getAdminToken() {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || null
  } catch (e) {
    return null
  }
}

export function getCachedAdmin() {
  try {
    const raw = localStorage.getItem(ADMIN_PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    return null
  }
}

function persistSession(token, user) {
  try {
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token)
    if (user) localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(user))
  } catch (e) {}
}

function clearSession() {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    localStorage.removeItem(ADMIN_PROFILE_KEY)
  } catch (e) {}
}

function errorMessage(payload, fallback) {
  const detail = payload?.detail
  if (Array.isArray(detail)) {
    return detail.map(item => item?.msg || 'Invalid value').join(', ')
  }
  if (typeof detail === 'string') return detail
  if (payload?.message) return payload.message
  if (payload?.error) return payload.error
  return fallback
}

/**
 * Authenticated request against the Faculty portal API.
 * Throws an Error with the server-provided message on failure.
 */
export async function adminRequest(path, options = {}) {
  const token = getAdminToken()
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}/admin${path}`, { ...options, headers })
  } catch (e) {
    throw new Error('Unable to reach the CampusConnect API. Is the backend running?')
  }

  if (response.status === 401 || response.status === 403) {
    clearSession()
    const payload = await response.json().catch(() => null)
    throw new Error(errorMessage(payload, 'Faculty authorization expired. Please sign in again.'))
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(errorMessage(payload, `Request failed (${response.status})`))
  }
  return payload
}

// ---------------- Authentication ----------------

export const adminSignIn = async (email, password) => {
  let response
  try {
    response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    })
  } catch (e) {
    throw new Error('Unable to reach the CampusConnect API. Is the backend running?')
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(errorMessage(payload, 'Access Denied: verified faculty credentials are required'))
  }

  const token = payload?.session?.access_token
  const user = payload?.user
  if (!token || !user) throw new Error('Authentication failed: no faculty session returned')
  persistSession(token, user)
  return user
}

export const adminSignOut = async () => {
  clearSession()
  try {
    const { supabase } = await import('./supabase')
    await supabase.auth.signOut()
  } catch (e) {}
}

export const checkIsAdmin = async () => {
  const token = getAdminToken()
  if (!token) return false
  try {
    const profile = await adminRequest('/me')
    if (!profile || !['admin', 'faculty'].includes(profile.role)) {
      clearSession()
      return false
    }
    persistSession(token, profile)
    return true
  } catch (e) {
    return false
  }
}

// ---------------- Dashboard & Analytics ----------------

export const getAdminDashboardStats = () => adminRequest('/dashboard')

export const getAdminAnalytics = () => adminRequest('/analytics')

export const getActivityLogs = (limit = 50) => adminRequest(`/activity-logs?limit=${limit}`)

// ---------------- Events / Hackathons ----------------

// In-memory event store so admin pages can render their first frame synchronously
let cachedEvents = []
const storeListeners = new Set()

function notifyStore() {
  storeListeners.forEach((fn) => {
    try { fn() } catch (e) {}
  })
}

function setCachedEvents(events) {
  cachedEvents = Array.isArray(events) ? events : []
  notifyStore()
}

// Lets an open Student Dashboard refresh as soon as faculty publish, edit or delete
function broadcastEventChange(action) {
  try {
    window.dispatchEvent(new CustomEvent('campus_events_updated', { detail: { action } }))
  } catch (e) {}
  try {
    localStorage.setItem('cc_events_revision', String(Date.now()))
  } catch (e) {}
}

export function getCachedEventsSync() {
  return cachedEvents
}

export function subscribeAdminStore(fn) {
  storeListeners.add(fn)
  return () => storeListeners.delete(fn)
}

export const getAdminEvents = async ({ status = 'all', type = 'all', search = '', page = 1, pageSize = 25 } = {}) => {
  const params = new URLSearchParams({ status, event_type: type, page: String(page), page_size: String(pageSize) })
  if (search) params.set('search', search)
  const data = await adminRequest(`/events?${params.toString()}`)
  // Only the unfiltered first page seeds the shared store
  if (!search && status === 'all' && type === 'all' && page === 1) {
    setCachedEvents(data?.items)
  }
  return data
}

export const createEvent = async (eventData) => {
  const created = await adminRequest('/events', {
    method: 'POST',
    body: JSON.stringify(eventData),
  })
  setCachedEvents([...cachedEvents, created])
  broadcastEventChange('created')
  return created
}

export const updateEvent = async (eventId, eventData) => {
  const updated = await adminRequest(`/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(eventData),
  })
  setCachedEvents(cachedEvents.map((ev) => (String(ev.id) === String(eventId) ? updated : ev)))
  broadcastEventChange('updated')
  return updated
}

export const setEventStatus = async (eventId, status) => {
  const updated = await adminRequest(`/events/${eventId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  setCachedEvents(cachedEvents.map((ev) => (String(ev.id) === String(eventId) ? { ...ev, ...updated } : ev)))
  broadcastEventChange(status)
  return updated
}

export const deleteEvent = async (eventId) => {
  const result = await adminRequest(`/events/${eventId}`, { method: 'DELETE' })
  setCachedEvents(cachedEvents.filter((ev) => String(ev.id) !== String(eventId)))
  broadcastEventChange('deleted')
  return result
}

// Local-only RSVP simulation used by the admin preview buttons
export const simulateStudentRSVP = async (eventId) => {
  setCachedEvents(cachedEvents.map((ev) => {
    if (String(ev.id) !== String(eventId)) return ev
    const capacity = Number(ev.capacity) || 0
    const registered = Number(ev.registered) || 0
    return { ...ev, registered: capacity ? Math.min(registered + 1, capacity) : registered + 1 }
  }))
  return { success: true }
}

// ---------------- Students ----------------

export const getAdminUsers = () => adminRequest('/users')

export const setStudentStatus = (userId, status) => adminRequest(`/users/${userId}/status`, {
  method: 'PATCH',
  body: JSON.stringify({ status }),
})

// ---------------- Registrations ----------------

export const getAdminRegistrations = ({ eventId = '', status = 'all', search = '' } = {}) => {
  const params = new URLSearchParams()
  if (eventId) params.set('event_id', eventId)
  if (status && status !== 'all') params.set('status', status)
  if (search) params.set('search', search)
  const query = params.toString()
  return adminRequest(`/registrations${query ? `?${query}` : ''}`)
}

export const setRegistrationStatus = (registrationId, status) => adminRequest(
  `/registrations/${registrationId}/status`,
  { method: 'POST', body: JSON.stringify({ status }) }
)

export async function downloadRegistrationsCsv(filters = {}) {
  const params = new URLSearchParams()
  if (filters.eventId) params.set('event_id', filters.eventId)
  if (filters.status && filters.status !== 'all') params.set('status', filters.status)
  const query = params.toString()
  const response = await fetch(
    `${API_BASE_URL}/admin/registrations/export.csv${query ? `?${query}` : ''}`,
    { headers: { Authorization: `Bearer ${getAdminToken()}` } }
  )
  if (!response.ok) throw new Error('Unable to export registrations')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'campusconnect-registrations.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

// ---------------- Announcements ----------------

export const getAdminAnnouncements = () => adminRequest('/announcements')

export const createAnnouncement = (data) => adminRequest('/announcements', {
  method: 'POST',
  body: JSON.stringify(data),
})

export const updateAnnouncement = (id, data) => adminRequest(`/announcements/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
})

export const setAnnouncementStatus = (id, status) => adminRequest(`/announcements/${id}/status`, {
  method: 'PATCH',
  body: JSON.stringify({ status }),
})

export const deleteAnnouncement = (id) => adminRequest(`/announcements/${id}`, { method: 'DELETE' })

// ---------------- Faculty accounts ----------------

export const getFacultyAccounts = () => adminRequest('/faculty')

export const createFacultyAccount = (data) => adminRequest('/faculty', {
  method: 'POST',
  body: JSON.stringify(data),
})

export const setFacultyStatus = (accountId, status) => adminRequest(`/faculty/${accountId}/status`, {
  method: 'PATCH',
  body: JSON.stringify({ status }),
})
