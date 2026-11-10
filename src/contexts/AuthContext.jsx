import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../services/supabase'
import { setCachedAuthToken } from '../services/api'

const AuthContext = createContext({})

// Fast in-memory cache for user profiles
const profileMemoryCache = new Map()

// Synchronous session reader for 0ms render
const getStoredSessionSync = () => {
  try {
    const ccSession = sessionStorage.getItem('cc_active_session') || localStorage.getItem('cc_active_session')
    if (ccSession) {
      const parsed = JSON.parse(ccSession)
      if (parsed?.user) return parsed
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const val = localStorage.getItem(key)
        if (val) {
          const parsed = JSON.parse(val)
          if (parsed?.user || parsed?.currentSession?.user) {
            return parsed.currentSession || parsed
          }
        }
      }
    }
  } catch (_) {}
  return null
}

const getCachedProfileFromStorage = (userId) => {
  if (!userId) return null
  if (profileMemoryCache.has(userId)) {
    return profileMemoryCache.get(userId)
  }
  try {
    const raw = sessionStorage.getItem(`cc_profile_${userId}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      profileMemoryCache.set(userId, parsed)
      return parsed
    }
  } catch (_) {}
  return null
}

const saveCachedProfileToStorage = (userId, profileData) => {
  if (!userId || !profileData) return
  profileMemoryCache.set(userId, profileData)
  try {
    sessionStorage.setItem(`cc_profile_${userId}`, JSON.stringify(profileData))
  } catch (_) {}
}

export const AuthProvider = ({ children }) => {
  // Synchronous initialization ensures frame-0 (0ms) render with zero spinners
  const [session, setSession] = useState(() => {
    const s = getStoredSessionSync()
    if (s?.access_token) setCachedAuthToken(s.access_token)
    return s
  })

  const [user, setUser] = useState(() => {
    const s = getStoredSessionSync()
    return s?.user ?? null
  })

  const [profile, setProfile] = useState(() => {
    const s = getStoredSessionSync()
    if (!s?.user) return null
    const meta = s.user.user_metadata || {}
    return {
      id: s.user.id,
      email: s.user.email,
      full_name: meta.full_name || meta.name || s.user.email?.split('@')[0] || 'Student Builder',
      role: meta.role || (s.user.email === 'admin@demo.com' ? 'admin' : 'student'),
      skills: Array.isArray(meta.skills) ? meta.skills : ['React', 'Python', 'Tailwind'],
      interests: Array.isArray(meta.interests) ? meta.interests : ['Hackathons', 'AI/ML'],
      bio: meta.bio || 'Collegiate builder exploring campus events & hackathon teams.',
      university: meta.university || 'University Engineering Campus',
      major: meta.major || 'Computer Science & Engineering',
      graduation_year: meta.graduation_year || '2026',
      github: meta.github || 'https://github.com',
      linkedin: meta.linkedin || 'https://linkedin.com'
    }
  })

  // Start with loading: false if we have a stored session; otherwise quickly verify
  const [loading, setLoading] = useState(false)

  // Deduplication refs
  const currentUserIdRef = useRef(user?.id ?? null)
  const currentSessionTokenRef = useRef(session?.access_token ?? null)

  const hydrateProfile = useCallback((currentUser) => {
    if (!currentUser) {
      setProfile(null)
      return null
    }

    const userId = currentUser.id
    const cached = getCachedProfileFromStorage(userId)

    if (cached) {
      setProfile(cached)
      return cached
    }

    const meta = currentUser.user_metadata || {}
    const syntheticProfile = {
      id: userId,
      email: currentUser.email,
      full_name: meta.full_name || meta.name || currentUser.email?.split('@')[0] || 'Student Builder',
      role: meta.role || (currentUser.email === 'admin@demo.com' ? 'admin' : 'student'),
      skills: Array.isArray(meta.skills) ? meta.skills : ['React', 'Python', 'Tailwind'],
      interests: Array.isArray(meta.interests) ? meta.interests : ['Hackathons', 'AI/ML'],
      bio: meta.bio || 'Collegiate builder exploring campus events & hackathon teams.',
      university: meta.university || 'University Engineering Campus',
      major: meta.major || 'Computer Science & Engineering',
      graduation_year: meta.graduation_year || '2026',
      github: meta.github || 'https://github.com',
      linkedin: meta.linkedin || 'https://linkedin.com'
    }

    saveCachedProfileToStorage(userId, syntheticProfile)
    setProfile(syntheticProfile)
    return syntheticProfile
  }, [])

  useEffect(() => {
    let isMounted = true

    // Non-blocking background session verification
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!isMounted) return

        if (session?.user) {
          currentUserIdRef.current = session.user.id
          currentSessionTokenRef.current = session.access_token
          setCachedAuthToken(session.access_token)
          setSession(session)
          setUser(session.user)
          hydrateProfile(session.user)
        }
      })
      .catch(() => {})

    // Auth state change listener with strict deduplication
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return

      const newUser = newSession?.user ?? null
      const newUserId = newUser?.id ?? null
      const newToken = newSession?.access_token ?? null

      if (event === 'SIGNED_OUT') {
        currentUserIdRef.current = null
        currentSessionTokenRef.current = null
        setCachedAuthToken(null)
        setSession(null)
        setUser(null)
        setProfile(null)
        return
      }

      if (event === 'TOKEN_REFRESHED' && newUserId === currentUserIdRef.current) {
        currentSessionTokenRef.current = newToken
        setCachedAuthToken(newToken)
        setSession(newSession)
        return
      }

      if (
        newUserId === currentUserIdRef.current &&
        newToken === currentSessionTokenRef.current
      ) {
        return
      }

      currentUserIdRef.current = newUserId
      currentSessionTokenRef.current = newToken
      if (newToken) setCachedAuthToken(newToken)
      setSession(newSession)
      setUser(newUser)

      if (newUser) {
        hydrateProfile(newUser)
      } else {
        setProfile(null)
      }
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [hydrateProfile])

  const updateProfileCache = useCallback((updatedFields) => {
    const userId = currentUserIdRef.current
    if (!userId) return
    setProfile((prev) => {
      const merged = { ...prev, ...updatedFields }
      saveCachedProfileToStorage(userId, merged)
      return merged
    })
    setUser((currentUser) => {
      if (!currentUser) return currentUser
      return {
        ...currentUser,
        user_metadata: {
          ...(currentUser.user_metadata || {}),
          ...updatedFields,
          full_name: updatedFields.full_name || updatedFields.name || currentUser.user_metadata?.full_name
        }
      }
    })
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('campus_profile_updated', {
        detail: { userId, profile: updatedFields }
      }))
      window.dispatchEvent(new CustomEvent('campus_directory_updated', {
        detail: { userId, profile: updatedFields }
      }))
    }
  }, [])

  useEffect(() => {
    if (!user?.id) return undefined

    const syncProfile = (fields) => {
      if (!fields || typeof fields !== 'object') return
      setProfile((currentProfile) => {
        const merged = { ...currentProfile, ...fields }
        saveCachedProfileToStorage(user.id, merged)
        return merged
      })
      setUser((currentUser) => currentUser ? {
        ...currentUser,
        user_metadata: {
          ...(currentUser.user_metadata || {}),
          ...fields,
          full_name: fields.full_name || fields.name || currentUser.user_metadata?.full_name
        }
      } : currentUser)
    }

    const handleProfileUpdate = (event) => {
      if (event.detail?.userId === user.id) syncProfile(event.detail.profile)
    }
    window.addEventListener('campus_profile_updated', handleProfileUpdate)

    let profileChannel
    try {
      profileChannel = supabase
        .channel(`student_profile_${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        }, (payload) => {
          if (payload.new) {
            syncProfile(payload.new)
            window.dispatchEvent(new CustomEvent('campus_profile_remote_updated', {
              detail: { userId: user.id, profile: payload.new }
            }))
            window.dispatchEvent(new CustomEvent('campus_directory_updated', {
              detail: { userId: user.id, profile: payload.new }
            }))
          }
        })
        .subscribe()
    } catch (error) {
      console.warn('Profile realtime subscription unavailable:', error)
    }

    return () => {
      window.removeEventListener('campus_profile_updated', handleProfileUpdate)
      if (profileChannel) supabase.removeChannel(profileChannel)
    }
  }, [user?.id])

  const setAuthData = useCallback((userData) => {
    if (!userData) {
      setUser(null)
      setProfile(null)
      currentUserIdRef.current = null
      return
    }

    const userId = userData.id || 'usr_' + Date.now()
    const enrichedUser = { ...userData, id: userId }
    currentUserIdRef.current = userId
    setUser(enrichedUser)
    hydrateProfile(enrichedUser)

    // Save to session storage for instant hydration
    try {
      const activeSession = {
        user: enrichedUser,
        access_token: 'fast_token_' + userId
      }
      sessionStorage.setItem('cc_active_session', JSON.stringify(activeSession))
      setCachedAuthToken(activeSession.access_token)
    } catch (_) {}
  }, [hydrateProfile])

  const logout = useCallback(() => {
    currentUserIdRef.current = null
    currentSessionTokenRef.current = null
    setCachedAuthToken(null)
    setUser(null)
    setSession(null)
    setProfile(null)
    profileMemoryCache.clear()
    try {
      sessionStorage.clear()
      localStorage.removeItem('cc_active_session')
    } catch (_) {}
  }, [])

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        session, 
        profile, 
        loading, 
        setAuthData, 
        updateProfileCache, 
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}
