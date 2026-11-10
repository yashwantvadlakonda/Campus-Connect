/**
 * CampusConnect API Client
 * Configured for live FastAPI backend at: https://campus-connect-1zwk.onrender.com
 * With automatic auth token interceptors & clean 401, 404, 422 error handling.
 */

import { ApiError } from './types'

// Primary API Base URL: Read from Vite environment or default to live Render backend
const API_BASE_URL = (
  import.meta.env.VITE_BACKEND_URL || 
  'https://campus-connect-1zwk.onrender.com/api'
).replace(/\/+$/, '')

let activeAuthToken = null

/**
 * Update the in-memory authorization token
 */
export function setAuthToken(token) {
  activeAuthToken = token
}

/**
 * Retrieve the current active authentication token from all available storage sources
 */
export function getAuthToken() {
  if (activeAuthToken) return activeAuthToken

  try {
    if (typeof window === 'undefined') return null

    // 1. Check custom active session
    const ccSession = sessionStorage.getItem('cc_active_session') || localStorage.getItem('cc_active_session')
    if (ccSession) {
      const parsed = JSON.parse(ccSession)
      const token = parsed?.access_token || parsed?.session?.access_token
      if (token) {
        activeAuthToken = token
        return token
      }
    }

    // 2. Check faculty admin session
    const adminSession = localStorage.getItem('faculty_admin_session')
    if (adminSession) {
      activeAuthToken = 'fast_token_usr_faculty'
      return activeAuthToken
    }

    // 3. Check Supabase auth token keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const val = JSON.parse(localStorage.getItem(key))
        const token = val?.access_token || val?.currentSession?.access_token
        if (token) {
          activeAuthToken = token
          return token
        }
      }
    }
  } catch (_) {}

  return null
}

/**
 * Base HTTP Request wrapper with Auth Interceptor and Structured Error Handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  const token = getAuthToken()

  // 1. Request Interceptor: Attach headers and authorization bearer token
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  }

  // Set timeout (extended to 15s to handle Render free-tier cold starts)
  const controller = new AbortController()
  const timeoutMs = options.timeout || 15000
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  let response
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    })
  } catch (networkError) {
    clearTimeout(timeoutId)
    if (networkError.name === 'AbortError') {
      throw new ApiError(408, 'Request Timeout', {
        detail: 'The server took too long to respond. The Render service may be waking from cold start.'
      })
    }
    throw new ApiError(0, 'Network Error', {
      detail: `Unable to connect to live backend at ${API_BASE_URL}. Please check internet connection.`
    })
  } finally {
    clearTimeout(timeoutId)
  }

  // 2. Response Interceptor: Parse JSON or handle non-JSON responses
  let data = null
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json()
    } catch (_) {
      data = null
    }
  }

  // 3. Response Interceptor: Handle HTTP Error Codes (401, 404, 422, 500)
  if (!response.ok) {
    // 401 Unauthorized: Session expired or invalid token
    if (response.status === 401) {
      activeAuthToken = null
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized', {
          detail: { endpoint, status: 401 }
        }))
      }
      throw new ApiError(401, 'Unauthorized', data || { detail: 'Authentication session expired. Please sign in again.' })
    }

    // 404 Not Found: Resource not found
    if (response.status === 404) {
      throw new ApiError(404, 'Not Found', data || { detail: `The requested endpoint or resource was not found: ${endpoint}` })
    }

    // 422 Unprocessable Entity: FastAPI Pydantic schema validation failure
    if (response.status === 422) {
      throw new ApiError(422, 'Unprocessable Entity', data || { detail: 'Request validation failed against schema.' })
    }

    // Default error handling for 400, 403, 500, etc.
    throw new ApiError(response.status, response.statusText || 'Error', data)
  }

  return data
}

// ============================================================================
// Core Typed Endpoint Implementations
// ============================================================================

/**
 * Authentication Endpoints
 */
export const authApi = {
  /**
   * Register a new student account
   * POST /api/auth/signup
   */
  signUp: async (payload) => {
    const res = await request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    if (res?.session?.access_token) {
      setAuthToken(res.session.access_token)
    }
    return res
  },

  /**
   * Authenticate student or faculty user
   * POST /api/auth/login
   */
  login: async (credentials) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    if (res?.session?.access_token) {
      setAuthToken(res.session.access_token)
    }
    return res
  },

  /**
   * Terminate active user session
   * POST /api/auth/logout
   */
  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' })
    } catch (_) {}
    setAuthToken(null)
    return { success: true }
  },

  /**
   * Retrieve current authenticated user profile & metadata
   * GET /api/auth/me
   */
  getMe: () => request('/auth/me'),
}

/**
 * Events & Registration Endpoints
 */
export const eventsApi = {
  /**
   * Fetch all active campus events
   * GET /api/events
   */
  getEvents: () => request('/events'),

  /**
   * Register student for a specific campus event
   * POST /api/events/{event_id}/register
   */
  register: (eventId, credentials = {}) => {
    return request(`/events/${eventId}/register`, {
      method: 'POST',
      body: JSON.stringify({ credentials }),
    })
  },

  /**
   * Create a squad/team for an event
   * POST /api/events/{event_id}/teams
   */
  createTeam: (eventId, teamData) => {
    return request(`/events/${eventId}/teams`, {
      method: 'POST',
      body: JSON.stringify(teamData),
    })
  },

  /**
   * Join an existing squad using an alphanumeric squad code
   * POST /api/teams/join
   */
  joinTeam: (teamCode) => {
    return request('/teams/join', {
      method: 'POST',
      body: JSON.stringify({ team_code: teamCode }),
    })
  },

  /**
   * Fetch user's formed squad for an event
   * GET /api/events/{event_id}/my-team
   */
  getMyTeam: (eventId) => request(`/events/${eventId}/my-team`),

  /**
   * Fetch team details by squad ID
   * GET /api/teams/{team_id}
   */
  getTeam: (teamId) => request(`/teams/${teamId}`),

  /**
   * Invite another student to join your squad
   * POST /api/teams/{team_id}/invite
   */
  inviteMember: (teamId, receiverId) => {
    return request(`/teams/${teamId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ receiver_id: receiverId }),
    })
  },

  /**
   * Fetch registered attendees/participants for an event
   * GET /api/events/{event_id}/participants
   */
  getParticipants: (eventId) => request(`/events/${eventId}/participants`),
}

/**
 * Teammate Matching & Chat Endpoints
 */
export const matchingApi = {
  /**
   * Get algorithmically suggested builder peers
   * GET /api/teammates/suggested
   */
  getSuggested: () => request('/teammates/suggested'),

  /**
   * Swipe right (interested) or left (pass) on a prospective teammate
   * POST /api/teammates/swipe
   */
  swipe: (targetUserId, isInterested) => {
    return request('/teammates/swipe', {
      method: 'POST',
      body: JSON.stringify({
        targetUserId,
        isInterested: Boolean(isInterested),
      }),
    })
  },

  /**
   * Get confirmed mutual matches
   * GET /api/matches
   */
  getMatches: () => request('/matches'),

  /**
   * Get message history for a confirmed match
   * GET /api/matches/{match_id}/messages
   */
  getMessages: (matchId) => request(`/matches/${matchId}/messages`),

  /**
   * Send a direct message to a confirmed teammate match
   * POST /api/matches/{match_id}/messages
   */
  sendMessage: (matchId, content) => {
    return request(`/matches/${matchId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
  },
}

/**
 * User & Profile Endpoints
 */
export const userApi = {
  /**
   * Get logged-in student profile details
   * GET /api/profile
   */
  getProfile: () => request('/profile'),

  /**
   * Update student profile, skills, and bio
   * PUT /api/profile
   */
  updateProfile: (profileData) => {
    return request('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    })
  },

  /**
   * Get real-time student dashboard telemetry & registered events count
   * GET /api/dashboard
   */
  getDashboard: () => request('/dashboard'),
}

/**
 * Faculty Governance & Admin Endpoints
 */
export const adminApi = {
  /**
   * Verify faculty administrator privileges
   * GET /api/admin/me
   */
  verifyAdmin: () => request('/admin/me'),

  /**
   * Get aggregated faculty analytics & capacity metrics
   * GET /api/admin/dashboard
   */
  getDashboard: () => request('/admin/dashboard'),

  /**
   * List all campus events in faculty management console
   * GET /api/admin/events
   */
  getEvents: () => request('/admin/events'),

  /**
   * Publish a new campus event
   * POST /api/admin/events
   */
  createEvent: (eventData) => {
    return request('/admin/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    })
  },

  /**
   * Update an existing event's details, dates, or capacity
   * PUT /api/admin/events/{event_id}
   */
  updateEvent: (eventId, eventData) => {
    return request(`/admin/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    })
  },

  /**
   * Delete an event and cascade purge registrations
   * DELETE /api/admin/events/{event_id}
   */
  deleteEvent: (eventId) => {
    return request(`/admin/events/${eventId}`, {
      method: 'DELETE',
    })
  },

  /**
   * List all enrolled students in directory
   * GET /api/admin/users
   */
  getUsers: () => request('/admin/users'),

  /**
   * Fetch 6-week registration velocity and skill distributions
   * GET /api/admin/analytics
   */
  getAnalytics: () => request('/admin/analytics'),
}

// Export default API client object bundling all services
const apiClient = {
  auth: authApi,
  events: eventsApi,
  matching: matchingApi,
  user: userApi,
  admin: adminApi,
  setAuthToken,
  getAuthToken,
  request,
  baseUrl: API_BASE_URL,
}

export default apiClient
