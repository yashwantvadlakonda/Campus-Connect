import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Calendar, MapPin, Users, Sparkles, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { registerForEvent } from '../../../services/api'
import { toast } from 'react-hot-toast'

export default function EventRegistrationModal({ event, profile, onClose, onSuccess }) {
  const [credentials, setCredentials] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const requiredFields = (Array.isArray(event.required_registration_fields) && event.required_registration_fields.length > 0)
    ? event.required_registration_fields
    : ['Full Name', 'Roll Number', 'Department', 'GitHub URL']

  useEffect(() => {
    // Pre-populate fields from current user's profile
    const initial = {}
    requiredFields.forEach(field => {
      const lower = field.toLowerCase()
      if (lower.includes('name')) {
        initial[field] = profile?.full_name || ''
      } else if (lower.includes('email')) {
        initial[field] = profile?.email || ''
      } else if (lower.includes('roll') || lower.includes('id')) {
        initial[field] = '2023CSE' + Math.floor(1000 + Math.random() * 9000)
      } else if (lower.includes('dept') || lower.includes('branch')) {
        initial[field] = 'Computer Science & Engineering'
      } else if (lower.includes('year')) {
        initial[field] = '3rd Year'
      } else if (lower.includes('github')) {
        initial[field] = 'https://github.com/' + (profile?.email?.split('@')[0] || 'student')
      } else if (lower.includes('skill')) {
        initial[field] = Array.isArray(profile?.skills) ? profile.skills.join(', ') : 'React, Python, Tailwind'
      } else {
        initial[field] = ''
      }
    })
    setCredentials(initial)
  }, [event, profile])

  const handleInputChange = (field, val) => {
    setCredentials(prev => ({ ...prev, [field]: val }))
    if (error) setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validate all required fields
    for (const field of requiredFields) {
      if (!credentials[field] || !String(credentials[field]).trim()) {
        setError(`Please provide your "${field}" to complete registration.`)
        return
      }
    }

    setLoading(true)
    try {
      const result = await registerForEvent(event.id, credentials)
      toast.success('Spot secured! Registration verified by database ACID lock.', { icon: '🎟️' })
      onSuccess(result, credentials)
    } catch (err) {
      setError(err?.message || 'Registration failed. Please check capacity.')
    } finally {
      setLoading(false)
    }
  }

  const registeredCount = Number(event.registered || 0)
  const capacityCount = Number(event.capacity || 100)
  const isFull = registeredCount >= capacityCount
  const capacityPercent = Math.min(100, Math.round((registeredCount / (capacityCount || 1)) * 100))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col mx-auto"
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh] overflow-hidden">
          {/* 1. Standardized Sticky Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 z-10 p-5 flex items-center justify-between shrink-0">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-1">
                <Sparkles size={11} />
                <span>Student Registration</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate max-w-md">
                {event.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-xl hover:bg-slate-100"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* 2. Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Quick Meta Information */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar size={14} className="text-indigo-600" />
                  {event.date || event.start_at?.slice(0, 10) || 'Upcoming'}
                </span>
                <span className="flex items-center gap-1.5 truncate max-w-[200px]">
                  <MapPin size={14} className="text-rose-500 shrink-0" />
                  {event.venue || event.venue_name || 'Campus Venue'}
                </span>
              </div>

              <div>
                {event.is_team_event ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-100/80 text-indigo-700 font-bold text-xs">
                    <Users size={12} />
                    Team Event ({event.min_team_size || 2}-{event.max_team_size || 4} members)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100/80 text-emerald-700 font-bold text-xs">
                    Solo Event (1 Spot)
                  </span>
                )}
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 font-medium">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Dynamic Credentials Section */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 font-mono">
                Required Participant Credentials ({requiredFields.length})
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                These credentials will be issued to your encrypted digital pass and stored in PostgreSQL.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requiredFields.map((field) => {
                  const lower = field.toLowerCase()
                  const isUrl = lower.includes('url') || lower.includes('link') || lower.includes('github') || lower.includes('portfolio')
                  const isFullWidth = lower.includes('skills') || lower.includes('address') || lower.includes('bio')

                  return (
                    <div key={field} className={isFullWidth ? 'md:col-span-2' : ''}>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-mono">
                        {field} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type={isUrl ? 'url' : 'text'}
                        required
                        placeholder={`Enter your ${field.toLowerCase()}...`}
                        value={credentials[field] || ''}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Seat Capacity Progress Meter */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs text-slate-600 font-mono">
                <span>Verified Seat Capacity</span>
                <span className="font-bold text-slate-900">{registeredCount} / {capacityCount} seats reserved</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${isFull ? 'bg-rose-500' : 'bg-indigo-600'}`}
                  style={{ width: `${capacityPercent}%` }}
                />
              </div>
              {isFull && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">
                  This event has reached full capacity. No additional registrations can be allocated.
                </p>
              )}
            </div>
          </div>

          {/* 3. Standardized Sticky Footer */}
          <div className="sticky bottom-0 bg-white border-t border-slate-200 z-10 p-4 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isFull}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                isFull
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 active:scale-95'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Securing Seat...</span>
                </>
              ) : (
                <>
                  <span>Confirm Registration</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
