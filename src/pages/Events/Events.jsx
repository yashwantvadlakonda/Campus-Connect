import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { getEvents, subscribeEvents, getMyTeam, getMyRegistrations } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { 
  Calendar, MapPin, Users, X, Check, Loader2, Tag, 
  Sparkles, Layers, LayoutGrid, RotateCcw, Clock, Building2,
  KeyRound, Shield, CheckCircle2, ArrowRight, UserPlus
} from 'lucide-react'

// Modals
import EventRegistrationModal from './components/EventRegistrationModal'
import RegistrationConfirmationModal from './components/RegistrationConfirmationModal'
import CreateTeamModal from './components/CreateTeamModal'
import JoinTeamModal from './components/JoinTeamModal'
import TeamDashboardModal from './components/TeamDashboardModal'

export default function Events({ filterType = null }) {
  const { profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [events, setEvents] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'swipe'
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [feedFilter, setFeedFilter] = useState('all')

  // Workflow Modal States
  const [registrationModalEvent, setRegistrationModalEvent] = useState(null)
  const [confirmedRegistration, setConfirmedRegistration] = useState(null)
  const [createTeamEvent, setCreateTeamEvent] = useState(null)
  const [joinTeamEvent, setJoinTeamEvent] = useState(null)
  const [activeTeamDashboard, setActiveTeamDashboard] = useState(null)

  // Track student's teams & registered events locally
  const [registeredEventIds, setRegisteredEventIds] = useState(new Set())
  const [userTeamsByEvent, setUserTeamsByEvent] = useState({})

  // Fetch events function with stale-while-revalidate
  const fetchEventsData = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) {
        setLoading(true)
        setError(null)
      }
      const data = await getEvents()
      if (Array.isArray(data)) {
        setEvents(data)
        setRegisteredEventIds(new Set(data.filter(ev => ev.is_registered).map(ev => String(ev.id))))
        setError(null)
      } else {
        setEvents([])
        if (!isBackground) setError('Unable to load campus events right now.')
      }
    } catch (err) {
      console.error('API Error:', err)
      if (!isBackground) {
        setEvents([])
        setError('Unable to load campus events right now. Please try again.')
      }
    } finally {
      if (!isBackground) setLoading(false)
    }
  }, [])

  // 1. Initial Load & Real-Time Event Sync (Faculty to Student View)
  useEffect(() => {
    fetchEventsData()

    // Real-Time subscription: Supabase Realtime + Faculty Portal Storage/Event Broadcast
    const unsubscribe = subscribeEvents(() => {
      fetchEventsData(true)
    })

    return () => {
      unsubscribe()
    }
  }, [fetchEventsData])

  // Check URL query params for ?join_team=CODE invite links
  useEffect(() => {
    const inviteCode = searchParams.get('join_team')
    if (inviteCode && events.length > 0) {
      setJoinTeamEvent(events[0])
      toast(`Joining squad with invite code: ${inviteCode}`, { icon: '🤝' })
    }
  }, [searchParams, events])

  // Fetch existing teams for registered events
  useEffect(() => {
    events.forEach(ev => {
      getMyTeam(ev.id).then(team => {
        if (team) {
          setUserTeamsByEvent(prev => ({ ...prev, [ev.id]: team }))
          setRegisteredEventIds(prev => new Set([...prev, ev.id]))
        }
      }).catch(() => {})
    })
  }, [events])

  // Open dynamic registration modal
  const handleInitiateRegister = (event) => {
    if (event.registered >= event.capacity) {
      toast.error('This event has reached full capacity!')
      return
    }
    setRegistrationModalEvent(event)
  }

  // Handle successful registration response
  const handleRegistrationSuccess = (regResult, credentials) => {
    const event = registrationModalEvent
    setRegistrationModalEvent(null)

    // Mark event registered and increment local count
    setRegisteredEventIds(prev => new Set([...prev, event.id]))
    setEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, registered: Math.min(ev.capacity, ev.registered + 1) } : ev))

    // Open confirmation branching modal
    setConfirmedRegistration({
      event,
      registrationData: regResult,
      credentials
    })
  }

  // Handle swipe deck gesture
  const handleSwipe = (direction, event, isFull) => {
    if (direction === 'right') {
      if (isFull) {
        toast.error('Event is full!')
        setCurrentIndex(prev => prev + 1)
      } else {
        handleInitiateRegister(event)
      }
    } else {
      toast('Event skipped', { icon: '⏭️' })
      setCurrentIndex(prev => prev + 1)
    }
  }

  // Post-Team creation handler
  const handleTeamCreated = (newTeam) => {
    const eventId = newTeam.event_id
    setUserTeamsByEvent(prev => ({ ...prev, [eventId]: newTeam }))
    const targetEvent = events.find(e => String(e.id) === String(eventId)) || createTeamEvent
    setCreateTeamEvent(null)
    setActiveTeamDashboard({
      event: targetEvent,
      team: newTeam
    })
  }

  // Post-Team join handler
  const handleTeamJoined = (joinedTeam) => {
    const eventId = joinedTeam.event_id
    setUserTeamsByEvent(prev => ({ ...prev, [eventId]: joinedTeam }))
    const targetEvent = events.find(e => String(e.id) === String(eventId)) || joinTeamEvent
    setJoinTeamEvent(null)
    if (searchParams.get('join_team')) {
      searchParams.delete('join_team')
      setSearchParams(searchParams)
    }
    setActiveTeamDashboard({
      event: targetEvent,
      team: joinedTeam
    })
  }

  const categories = ['All', 'Technology', 'Business', 'Seminar', 'Design']

  const isRegisteredEvent = (event) => registeredEventIds.has(String(event.id)) || Boolean(event.is_registered)

  const typeFilteredEvents = filterType === 'hackathon'
    ? events.filter(e => {
        const t = String(e.event_type || '').toLowerCase()
        const c = String(e.category || '').toLowerCase()
        const title = String(e.title || '').toLowerCase()
        return t === 'hackathon' || c === 'hackathon' || title.includes('hackathon')
      })
    : filterType
      ? events.filter(e => String(e.event_type || '').toLowerCase() === String(filterType).toLowerCase())
      : events

  const feedFilteredEvents = typeFilteredEvents.filter(event => {
    const registered = isRegisteredEvent(event)
    if (feedFilter === 'registered') return registered
    if (feedFilter === 'open') return !registered && Number(event.registered || 0) < Number(event.capacity || 1)
    return true
  })

  const filteredEvents = selectedCategory === 'All'
    ? feedFilteredEvents
    : feedFilteredEvents.filter(e => String(e.category || '').toLowerCase() === selectedCategory.toLowerCase())

  if (loading) {
    return (
      <div className="flex h-[75vh] items-center justify-center flex-col gap-3">
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
        <p className="text-sm text-slate-500 font-medium">Synchronizing live campus events feed...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[75vh] items-center justify-center flex-col gap-3 text-center max-w-md mx-auto">
        <p className="text-sm text-rose-600 font-medium">{error}</p>
        <button
          onClick={() => fetchEventsData()}
          className="px-4 py-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 rounded-xl"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* Top Header & View Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-1.5 font-mono">
            <Sparkles size={13} className="text-indigo-600" />
            Live Real-Time Feed
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{filterType === 'hackathon' ? 'Hackathons' : 'Campus Events & Squad Finder'}</h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Join Squad via Code button */}
          <button
            onClick={() => setJoinTeamEvent(events[0] || { id: 'generic', title: 'Campus Hackathon' })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 text-xs font-bold transition-all shadow-2xs"
          >
            <KeyRound size={14} className="text-indigo-600" />
            <span>Join Squad by Code</span>
          </button>

          {/* View Switcher: Swipe Deck vs Grid */}
          <div className="flex items-center bg-slate-100 border border-slate-200 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid size={15} />
              <span>Browse Grid</span>
            </button>
            <button
              onClick={() => setViewMode('swipe')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'swipe'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers size={15} />
              <span>Swipe Deck</span>
            </button>
          </div>
        </div>
      </div>

      {/* SWIPE DECK MODE */}
      {viewMode === 'swipe' && (
        <div className="h-[75vh] flex flex-col items-center max-w-lg mx-auto w-full relative">
          {events.length === 0 ? (
            <div className="flex flex-col h-[70vh] items-center justify-center text-center animate-fade-in max-w-md mx-auto p-6">
              <div className="w-20 h-20 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center justify-center mb-6 shadow-xs">
                <Calendar className="text-indigo-600 w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">No Active Events</h2>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                There are currently no events open for swipe discovery. Newly published campus events will appear here immediately.
              </p>
              <button 
                onClick={() => setViewMode('grid')} 
                className="btn-secondary flex items-center justify-center gap-2 py-2.5 px-6 text-sm"
              >
                <LayoutGrid size={16} />
                <span>Switch to Grid View</span>
              </button>
            </div>
          ) : currentIndex >= events.length ? (
            <div className="flex flex-col h-[70vh] items-center justify-center text-center animate-fade-in max-w-md mx-auto p-6">
              <div className="w-20 h-20 bg-white border border-slate-200 rounded-3xl flex items-center justify-center mb-6 shadow-xs">
                <Calendar className="text-indigo-600 w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">All Caught Up!</h2>
              <p className="text-slate-600 text-sm mb-6">
                You've reviewed every active event on campus. Switch to grid view or reset to review again.
              </p>
              <button 
                onClick={() => setCurrentIndex(0)} 
                className="btn-secondary flex items-center justify-center gap-2 py-2.5 px-6 text-sm"
              >
                <RotateCcw size={16} />
                <span>Review Deck</span>
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 w-full relative">
                <AnimatePresence>
                  {(() => {
                    const currentEvent = events[currentIndex]
                    if (!currentEvent) return null

                    const isFull = currentEvent.registered >= currentEvent.capacity
                    const percentFilled = Math.min(100, Math.round((currentEvent.registered / currentEvent.capacity) * 100))
                    const isRegistered = registeredEventIds.has(currentEvent.id)
                    const userTeam = userTeamsByEvent[currentEvent.id]

                    return (
                      <motion.div
                        key={currentEvent.id}
                        initial={{ scale: 0.94, opacity: 0, y: 15 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, x: -100 }}
                        transition={{ duration: 0.28, ease: 'easeOut' }}
                        className="absolute inset-0 bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xl flex flex-col justify-between"
                      >
                        {/* Top Event Cover */}
                        <div className={`h-40 bg-gradient-to-r ${currentEvent.gradient || 'from-indigo-600 to-blue-600'} p-6 flex flex-col justify-between text-white relative`}>
                          <div className="flex justify-between items-start">
                            <span className="bg-white/95 backdrop-blur-md text-slate-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                              {currentEvent.category}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {currentEvent.is_team_event ? (
                                <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20 flex items-center gap-1">
                                  <Users size={12} /> Team ({currentEvent.min_team_size || 2}-{currentEvent.max_team_size || 4})
                                </span>
                              ) : (
                                <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20">
                                  Solo RSVP
                                </span>
                              )}
                              <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-xs ${
                                isFull ? 'bg-rose-500 text-white' : 'bg-emerald-600 text-white'
                              }`}>
                                {isFull ? 'Full' : `${currentEvent.capacity - currentEvent.registered} seats left`}
                              </span>
                            </div>
                          </div>

                          <div className="text-white/95 text-xs flex items-center gap-1.5 font-medium">
                            <Building2 size={14} />
                            <span>Host: {currentEvent.organiser || currentEvent.club}</span>
                          </div>
                        </div>

                        {/* Event Details */}
                        <div className="p-6 flex-1 flex flex-col overflow-y-auto space-y-4 bg-white">
                          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{currentEvent.title}</h2>

                          {/* Meta Row */}
                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                              <Calendar size={14} className="text-indigo-600 shrink-0" />
                              <span>{currentEvent.date}</span>
                            </div>
                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                              <Clock size={14} className="text-indigo-600 shrink-0" />
                              <span>{currentEvent.time}</span>
                            </div>
                            <div className="col-span-2 flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                              <MapPin size={14} className="text-rose-500 shrink-0" />
                              <span className="truncate">{currentEvent.venue}</span>
                            </div>
                          </div>

                          {/* Capacity progress */}
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
                              <span className="text-slate-600">Attendance Capacity</span>
                              <span className={isFull ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                                {currentEvent.registered} / {currentEvent.capacity} ({percentFilled}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div 
                                className={`h-2 rounded-full transition-all duration-500 ${isFull ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-blue-500'}`}
                                style={{ width: `${percentFilled}%` }}
                              />
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">About This Event</h3>
                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                              {currentEvent.description}
                            </p>
                          </div>

                          {/* Required Registration Fields preview */}
                          {currentEvent.required_registration_fields?.length > 0 && (
                            <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                              <span className="text-[11px] font-bold uppercase text-indigo-700 block mb-1 font-mono">
                                Required Credentials on Register:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {currentEvent.required_registration_fields.map(f => (
                                  <span key={f} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-indigo-200/80 text-indigo-700">
                                    {f}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })()}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-6 mt-4 z-10">
                <button 
                  onClick={() => handleSwipe('left', events[currentIndex], false)}
                  className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-md active:scale-95"
                  title="Skip"
                >
                  <X size={26} />
                </button>
                <button 
                  onClick={() => handleSwipe('right', events[currentIndex], events[currentIndex].registered >= events[currentIndex].capacity)}
                  className="w-16 h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center text-white transition-all shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95"
                  title="Register for Event"
                >
                  <Check size={28} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* GRID BROWSE MODE */}
      {viewMode === 'grid' && (
        <div className="space-y-6">
          {/* Registration Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { key: 'all', label: 'All Events' },
              { key: 'registered', label: 'Registered' },
              { key: 'open', label: 'Open for Registration' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFeedFilter(tab.key)}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                  feedFilter === tab.key
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                  selectedCategory === cat 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          {filteredEvents.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 max-w-lg mx-auto shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4 text-indigo-600">
                <Calendar size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Events Found</h3>
              <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto mb-6">
                {selectedCategory === 'All' 
                  ? "No campus events or hackathons have been published yet. Newly created events from the Faculty Portal will appear here in real time." 
                  : `No events currently scheduled under "${selectedCategory}".`}
              </p>
              {selectedCategory !== 'All' && (
                <button 
                  onClick={() => setSelectedCategory('All')}
                  className="px-4 py-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 rounded-xl"
                >
                  View All Events
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEvents.map(event => {
                const isFull = event.registered >= event.capacity
                const percent = Math.min(100, Math.round((event.registered / event.capacity) * 100))
                const isRegistered = registeredEventIds.has(event.id)
                const userTeam = userTeamsByEvent[event.id]

                return (
                  <div key={event.id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all group">
                    <div className={`h-28 bg-gradient-to-r ${event.gradient || 'from-indigo-600 to-blue-600'} p-4 flex justify-between items-start`}>
                      <span className="bg-white/90 backdrop-blur-md text-slate-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs border border-slate-200">
                        {event.category}
                      </span>

                      {isRegistered && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs">
                          Registered ✓
                        </span>
                      )}

                      <div className="flex items-center gap-1.5">
                        {event.is_team_event ? (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20 flex items-center gap-1">
                            <Users size={11} /> Squad ({event.min_team_size || 2}-{event.max_team_size || 4})
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20">
                            Solo RSVP
                          </span>
                        )}

                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full shadow-xs ${
                          isFull ? 'bg-rose-500 text-white' : 'bg-emerald-600 text-white'
                        }`}>
                          {isFull ? 'Full' : `${event.capacity - event.registered} spots left`}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                            {event.title}
                          </h3>
                          {isRegistered && (
                            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={11} /> Registered ✓
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 mt-1">Organized by {event.organiser || event.club}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-slate-600 mt-3">
                          <span className="flex items-center gap-1.5"><Calendar size={13} className="text-indigo-600" />{event.date}</span>
                          <span className="flex items-center gap-1.5"><Clock size={13} className="text-indigo-600" />{event.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1.5 truncate">
                          <MapPin size={13} className="text-rose-500 shrink-0" />
                          <span>{event.venue}</span>
                        </p>

                        <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                          {event.description}
                        </p>

                        {/* Required Credentials Preview */}
                        {event.required_registration_fields?.length > 0 && (
                          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-slate-400 font-mono font-medium">Fields:</span>
                            {event.required_registration_fields.slice(0, 3).map(f => (
                              <span key={f} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                {f}
                              </span>
                            ))}
                            {event.required_registration_fields.length > 3 && (
                              <span className="text-[10px] text-slate-400">+{event.required_registration_fields.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        {/* Capacity Meter */}
                        <div className="mb-4">
                          <div className="flex justify-between text-[11px] mb-1 text-slate-500 font-medium">
                            <span>Capacity</span>
                            <span className={isFull ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                              {event.registered}/{event.capacity} seats ({percent}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-500 ${isFull ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-blue-500'}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        {/* Conditional Action Buttons */}
                        {userTeam ? (
                          <button
                            onClick={() => setActiveTeamDashboard({ event, team: userTeam })}
                            className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <Shield size={14} className="text-indigo-600" />
                            <span>Manage Squad ({userTeam.name})</span>
                          </button>
                        ) : isRegistered ? (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={async () => {
                                try {
                                  const regs = await getMyRegistrations()
                                  const reg = Array.isArray(regs) ? regs.find(r => String(r.event_id) === String(event.id)) : null
                                  setConfirmedRegistration({
                                    event,
                                    registrationData: reg || { ticket_id: `TKT-${String(event.id).slice(0, 4).toUpperCase()}-8492` },
                                    credentials: reg?.credentials || {}
                                  })
                                } catch {
                                  setConfirmedRegistration({
                                    event,
                                    registrationData: { ticket_id: `TKT-${String(event.id).slice(0, 4).toUpperCase()}-8492` }
                                  })
                                }
                              }}
                              className="py-2.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 transition-all flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle2 size={14} />
                              <span>View Digital Pass</span>
                            </button>
                            <button
                              onClick={() => {
                                if (userTeam) {
                                  setActiveTeamDashboard({ event, team: userTeam })
                                } else if (event.is_team_event) {
                                  setCreateTeamEvent(event)
                                } else {
                                  toast('Solo event: no squad required.')
                                }
                              }}
                              className="py-2.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all flex items-center justify-center gap-1.5"
                            >
                              <Users size={14} />
                              <span>Squad Status</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleInitiateRegister(event)}
                            disabled={isFull}
                            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                              isFull
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shadow-indigo-500/10 hover:scale-[1.01] active:scale-[0.99]'
                            }`}
                          >
                            {isFull ? 'Capacity Reached' : 'Register / Claim Seat'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 1. Dynamic Student Registration Modal */}
      {registrationModalEvent && (
        <EventRegistrationModal
          event={registrationModalEvent}
          profile={profile}
          onClose={() => setRegistrationModalEvent(null)}
          onSuccess={handleRegistrationSuccess}
        />
      )}

      {/* 2. Post-Registration Confirmation & Team Formation Branching Modal */}
      {confirmedRegistration && (
        <RegistrationConfirmationModal
          event={confirmedRegistration.event}
          registrationData={confirmedRegistration.registrationData}
          credentials={confirmedRegistration.credentials}
          onClose={() => setConfirmedRegistration(null)}
          onCreateTeam={() => {
            const ev = confirmedRegistration.event
            setConfirmedRegistration(null)
            setCreateTeamEvent(ev)
          }}
          onJoinTeam={() => {
            const ev = confirmedRegistration.event
            setConfirmedRegistration(null)
            setJoinTeamEvent(ev)
          }}
        />
      )}

      {/* 3. Create Team Modal */}
      {createTeamEvent && (
        <CreateTeamModal
          event={createTeamEvent}
          onClose={() => setCreateTeamEvent(null)}
          onTeamCreated={handleTeamCreated}
        />
      )}

      {/* 4. Join Team Modal */}
      {joinTeamEvent && (
        <JoinTeamModal
          event={joinTeamEvent}
          onClose={() => setJoinTeamEvent(null)}
          onTeamJoined={handleTeamJoined}
        />
      )}

      {/* 5. Squad Headquarters & Member Recruitment Dashboard Modal */}
      {activeTeamDashboard && (
        <TeamDashboardModal
          event={activeTeamDashboard.event}
          team={activeTeamDashboard.team}
          onClose={() => setActiveTeamDashboard(null)}
          onUpdateTeam={(updated) => {
            setActiveTeamDashboard(p => ({ ...p, team: updated }))
            setUserTeamsByEvent(p => ({ ...p, [updated.event_id]: updated }))
          }}
        />
      )}
    </div>
  )
}
