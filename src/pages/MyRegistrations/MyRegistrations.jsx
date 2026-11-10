import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getMyRegistrations } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { Loader2, Calendar, MapPin, CheckCircle2, Clock, XCircle, Ticket } from 'lucide-react'

export default function MyRegistrations() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [registrations, setRegistrations] = useState([])

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const data = await getMyRegistrations()
        if (active) setRegistrations(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error(e)
        toast.error('Unable to load your registrations.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const statusBadge = (status) => {
    const s = String(status || 'approved').toLowerCase()
    if (s === 'approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (s === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200'
    if (s === 'rejected') return 'bg-rose-50 text-rose-700 border-rose-200'
    return 'bg-slate-50 text-slate-700 border-slate-200'
  }

  const statusIcon = (status) => {
    const s = String(status || 'approved').toLowerCase()
    if (s === 'approved') return <CheckCircle2 size={14} />
    if (s === 'pending') return <Clock size={14} />
    if (s === 'rejected') return <XCircle size={14} />
    return <Ticket size={14} />
  }

  if (loading) {
    return (
      <div className="flex h-[75vh] items-center justify-center flex-col gap-3">
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
        <p className="text-sm text-slate-500 font-medium">Loading your registrations...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Registrations</h1>
        <p className="text-sm text-slate-500 mt-1">Track your hackathon and event registrations and their approval status.</p>
      </div>

      {registrations.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <Ticket size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Registrations Yet</h3>
          <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto">
            Register for events and hackathons to see them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {registrations.map((reg, idx) => (
            <motion.div
              key={reg.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">{reg.event_title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{reg.event_club || 'Campus'}</p>
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge(reg.status)}`}>
                  {statusIcon(reg.status)}
                  {String(reg.status || 'approved').toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                <span className="flex items-center gap-1.5"><Calendar size={13} className="text-indigo-600" />{reg.event_date || 'Upcoming'}</span>
                {reg.start_time && <span className="flex items-center gap-1.5"><Clock size={13} className="text-indigo-600" />{reg.start_time}</span>}
                <span className="flex items-center gap-1.5"><MapPin size={13} className="text-rose-500" />{reg.venue_name || reg.venue || 'Campus'}</span>
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                Registered {new Date(reg.registered_at).toLocaleString()}
                {reg.team_name ? ` · Team: ${reg.team_name}` : ''}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
