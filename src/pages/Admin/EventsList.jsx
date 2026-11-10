import { useState, useEffect } from 'react'
import { 
  getAdminEvents, 
  getCachedEventsSync, 
  subscribeAdminStore, 
  deleteEvent, 
  createEvent, 
  updateEvent, 
  simulateStudentRSVP 
} from '../../services/adminApi'
import { 
  Plus, Edit2, Trash2, Loader2, AlertCircle, Calendar, 
  Users, MapPin, Search, Filter, Sparkles, Building2, Tag, 
  CheckCircle2, AlertTriangle, X, Zap 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import EventModal from './EventModal'

export default function AdminEventsList() {
  // Synchronous Frame 0 state initialization eliminates page transition delays
  const [events, setEvents] = useState(() => getCachedEventsSync())
  const [loading, setLoading] = useState(() => !getCachedEventsSync().length)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [search, setSearch] = useState('')
  const [clubFilter, setClubFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  // Delete Confirmation Modal State
  const [eventToDelete, setEventToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    // 1. Subscribe to reactive dynamic updates
    const unsubscribe = subscribeAdminStore(() => {
      setEvents(getCachedEventsSync())
    })

    // 2. Background sync
    getAdminEvents().then((data) => {
      const items = data?.items
      if (Array.isArray(items) && items.length > 0) {
        setEvents(items)
      }
      setLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleOpenModal = (event = null) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setSelectedEvent(null)
    setIsModalOpen(false)
  }

  const handleSaveEvent = async (eventData) => {
    try {
      if (selectedEvent) {
        await updateEvent(selectedEvent.id, eventData)
        toast.success('Event updated successfully in live store')
      } else {
        await createEvent(eventData)
        toast.success('Campus event published! Dynamically synced to directory & dashboard.', {
          icon: '🚀'
        })
      }
      handleCloseModal()
    } catch (error) {
      toast.error(error?.message || 'Failed to save event.')
    }
  }

  const confirmDelete = async () => {
    if (!eventToDelete) return
    setIsDeleting(true)
    try {
      await deleteEvent(eventToDelete.id)
      toast.success(`Event deleted. PostgreSQL ON DELETE CASCADE purged registrations.`, {
        icon: '🗑️'
      })
      setEventToDelete(null)
    } catch (error) {
      toast.error('Failed to delete event')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSimulateRSVP = (e, eventId, title) => {
    e.stopPropagation()
    simulateStudentRSVP(eventId)
    toast.success(`Live RSVP registered for "${title}". Capacity gauge updated!`, {
      icon: '⚡'
    })
  }

  // Filter list
  const filteredEvents = events.filter(e => {
    const matchesSearch = !search || 
      e.title.toLowerCase().includes(search.toLowerCase()) || 
      (e.venue_name || e.venue || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.club || '').toLowerCase().includes(search.toLowerCase())
    
    const matchesClub = clubFilter === 'All' || e.club === clubFilter
    const matchesStatus = statusFilter === 'All' || e.status === statusFilter
    
    return matchesSearch && matchesClub && matchesStatus
  })

  const clubs = ['All', ...new Set(events.map(e => e.club).filter(Boolean))]

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold uppercase tracking-wider mb-2 font-mono">
            <Sparkles size={14} />
            Event Orchestration
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Campus Event Management
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Dynamic creation and management with PostGIS coordinates, tags chip arrays, and pg_cron archival.
          </p>
        </div>

        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-xs shadow-indigo-500/20 transition-all active:scale-95"
        >
          <Plus size={16} />
          <span>New Campus Event</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search events by title, venue, or organizing club..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Club Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto scrollbar-none">
          <select
            value={clubFilter}
            onChange={(e) => setClubFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {clubs.map(c => (
              <option key={c} value={c}>Club: {c}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Deadlines</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Live Events Table */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-xs border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="p-4">Event & Organizing Club</th>
                <th className="p-4">Tags</th>
                <th className="p-4">Capacity Gauge</th>
                <th className="p-4">Deadline Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center">
                    <Loader2 className="animate-spin text-indigo-600 w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-mono">Synchronizing events...</p>
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-500">
                    <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-700">No events found matching your criteria</p>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => {
                  const registered = event.registered || 0
                  const capacity = event.capacity || 100
                  const percent = Math.min(100, Math.round((registered / capacity) * 100))
                  const isFull = registered >= capacity
                  const isActive = event.status === 'Active' || new Date(event.deadline_at) >= new Date()

                  return (
                    <tr key={event.id} className="hover:bg-slate-50/80 transition-colors group">
                      
                      {/* 1. Title & Club */}
                      <td className="p-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                            {event.title}
                          </span>
                          {event.is_team_event ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-mono">
                              👥 Squad ({event.min_team_size || 2}-{event.max_team_size || 4})
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                              👤 Solo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <Building2 size={13} className="text-slate-400" />
                          <span className="font-medium text-slate-600">{event.club}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <MapPin size={11} className="text-rose-500" />
                          <span className="truncate max-w-[220px]">{event.venue_name || event.venue}</span>
                        </div>
                      </td>

                      {/* 2. Tags Array */}
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-[240px]">
                          {(event.tags || []).map((tag) => (
                            <span 
                              key={tag}
                              className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-mono text-[10px] font-semibold px-2 py-0.5 rounded-md"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* 3. Capacity Gauge (e.g. 168/200) */}
                      <td className="p-4 w-56">
                        <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                          <span className={isFull ? 'text-rose-600 font-bold' : 'text-slate-800 font-semibold'}>
                            {registered} / {capacity}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-500">{percent}%</span>
                            {!isFull && (
                              <button
                                onClick={(e) => handleSimulateRSVP(e, event.id, event.title)}
                                className="bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-indigo-600 font-bold text-[10px] px-1.5 py-0.2 rounded transition-all active:scale-95"
                                title="Simulate student RSVP"
                              >
                                +RSVP
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isFull ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </td>

                      {/* 4. Deadline Status (Active / Closed) */}
                      <td className="p-4">
                        {isActive && !isFull ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active</span>
                          </span>
                        ) : isFull ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                            <span>Full</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                            <span>Closed</span>
                          </span>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">
                          {event.deadline_at ? event.deadline_at.slice(0, 10) : 'Open'}
                        </p>
                      </td>

                      {/* 5. Action Buttons */}
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button 
                            onClick={() => handleOpenModal(event)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-transparent hover:border-indigo-100"
                            title="Edit Event"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button 
                            onClick={() => setEventToDelete(event)}
                            className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                            title="Delete Event (Cascades)"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal (PostgreSQL ON DELETE CASCADE warning) */}
      <AnimatePresence>
        {eventToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-xs">
            <div className="fixed inset-0" onClick={() => !isDeleting && setEventToDelete(null)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] z-10 flex flex-col overflow-hidden mx-auto"
            >
              {/* Sticky Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 z-10 p-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Delete Campus Event?
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setEventToDelete(null)}
                  className="text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-xl hover:bg-slate-100 disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-slate-900 font-mono">"{eventToDelete.title}"</span>?
                </p>
                <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-2xl text-xs text-rose-800 leading-relaxed space-y-1">
                  <strong>PostgreSQL ON DELETE CASCADE:</strong>
                  <p>This will irrevocably delete the event record and cascade-purge all linked student registrations, RSVP seats, and team swipe entries.</p>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 bg-white border-t border-slate-200 z-10 p-4 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setEventToDelete(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={confirmDelete}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-60 active:scale-95"
                >
                  {isDeleting && <Loader2 size={13} className="animate-spin" />}
                  <span>Confirm & Cascade Delete</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit / Create Event Modal */}
      {isModalOpen && (
        <EventModal 
          event={selectedEvent} 
          onClose={handleCloseModal} 
          onSave={handleSaveEvent} 
        />
      )}
    </div>
  )
}
