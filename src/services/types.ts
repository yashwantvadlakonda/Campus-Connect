/**
 * CampusConnect API Types & Interfaces
 * Matches FastAPI OpenAPI Schema at https://campus-connect-1zwk.onrender.com/docs
 */

// ==================== Error Types ====================

export interface ValidationErrorItem {
  loc: (string | number)[]
  msg: string
  type: string
}

export interface FastApiHttpError {
  detail: string | ValidationErrorItem[]
}

export class ApiError extends Error {
  status: number
  statusText: string
  data: any
  validationErrors?: ValidationErrorItem[]

  constructor(status: number, statusText: string, data: any) {
    let message = `API Error ${status}: ${statusText}`
    let validationErrors: ValidationErrorItem[] | undefined

    if (data?.detail) {
      if (typeof data.detail === 'string') {
        message = data.detail
      } else if (Array.isArray(data.detail)) {
        validationErrors = data.detail
        const formatted = data.detail
          .map((item: ValidationErrorItem) => `${item.loc.slice(1).join('.')}: ${item.msg}`)
          .join(', ')
        message = `Validation Error: ${formatted}`
      }
    }

    super(message)
    this.name = 'ApiError'
    this.status = status
    this.statusText = statusText
    this.data = data
    this.validationErrors = validationErrors
  }
}

// ==================== Auth Types ====================

export interface SignUpRequest {
  email: string
  password: string
  full_name: string
  branch?: string
  year?: string
  skills?: string[]
  interests?: string[]
}

export interface LoginRequest {
  email: string
  password: string
}

export interface UserMetadata {
  full_name?: string
  name?: string
  role?: 'student' | 'admin'
  skills?: string[]
  interests?: string[]
  bio?: string
  branch?: string
  year?: string
}

export interface User {
  id: string
  email: string
  user_metadata?: UserMetadata
}

export interface AuthSession {
  access_token: string
  refresh_token?: string
  user: User
}

export interface AuthResponse {
  success: boolean
  session: AuthSession
  message?: string
}

// ==================== Event Types ====================

export interface CampusEvent {
  id: string
  title: string
  description?: string
  category: string
  club: string
  date: string
  time: string
  venue: string
  venue_name?: string
  capacity: number
  registered: number
  requiredSkills: string[]
  tags: string[]
  is_team_event: boolean
  min_team_size: number
  max_team_size: number
  required_registration_fields: string[]
  latitude?: number
  longitude?: number
  start_at?: string
  deadline_at?: string
  expire_at?: string
  status: 'Active' | 'Closed' | 'Archived'
}

export interface RegistrationRequest {
  credentials?: Record<string, any>
}

export interface RegistrationResponse {
  success: boolean
  message: string
  registration_id?: string
  ticket_id?: string
  event_id: string
  is_team_event?: boolean
  credentials?: Record<string, any>
}

// ==================== Team Types ====================

export interface TeamMember {
  id: string
  student_id: string
  student_name: string
  role: 'leader' | 'member'
  joined_at: string
}

export interface TeamInvitation {
  id: string
  team_id: string
  sender_id: string
  receiver_id: string
  receiver_name: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
}

export interface Team {
  id: string
  event_id: string
  name: string
  description?: string
  preferred_skills: string[]
  team_code: string
  leader_id: string
  min_team_size?: number
  max_team_size?: number
  members: TeamMember[]
  invitations?: TeamInvitation[]
}

export interface CreateTeamRequest {
  name: string
  description?: string
  preferred_skills?: string[]
}

export interface JoinTeamRequest {
  team_code: string
}

export interface TeamInviteRequest {
  receiver_id: string
}

// ==================== Teammate Matching Types ====================

export interface TeammateCandidate {
  id: string
  name: string
  major?: string
  year?: string
  bio?: string
  skills: string[]
  interests: string[]
  matchScore: string
  avatarGradient?: string
}

export interface SwipeRequest {
  targetUserId: string
  isInterested: boolean
}

export interface SwipeResponse {
  success?: boolean
  matched: boolean
  match_id?: string
  message?: string
}

export interface Match {
  id: string
  student_1: string
  student_2: string
  student_name?: string
  created_at: string
}

export interface ChatMessage {
  id: string
  match_id: string
  sender_id: string
  content: string
  created_at: string
}

export interface SendMessageRequest {
  content: string
}

// ==================== User & Dashboard Types ====================

export interface UserProfile {
  id: string
  email: string
  full_name: string
  bio: string
  branch?: string
  year?: string
  skills: string[]
  interests: string[]
  role: 'student' | 'admin'
}

export interface ProfileUpdate {
  full_name?: string
  bio?: string
  branch?: string
  year?: string
  skills?: string[]
  interests?: string[]
}

export interface DashboardStats {
  upcomingEvents: number
  registeredEvents: number
  suggestedTeammates: number
  matches: number
  recentActivity: any[]
}
