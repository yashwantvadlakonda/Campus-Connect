import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getAnnouncements, getMyRegistrations, getTeamInvitations, acceptTeamInvitation } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { Loader2, Bell, Megaphone, Ticket, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'

export default function Notifications() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [acceptingId, setAcceptingId] = useState(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const [announcements, registrations, invitations] = await Promise.all([
          getAnnouncements().catch(() => []),
          getMyRegistrations().catch(() => []),
          getTeamInvitations().catch(() => [])
        ])
        const list = []
        if (Array.isArray(announcements)) {
          announcements.forEach(a => {
            list.push({
              id: `ann-${a.id}`,
              type: 'announcement',
              title: a.title,
              body: a.body,
              priority: a.priority,
              date: a.created_at || a.published_at
            })
          })
        }
        if (Array.isArray(registrations)) {
          registrations.forEach(r => {
            list.push({
              id: `reg-${r.id}`,
              type: 'registration',
              title: `Registration ${String(r.status || 'approved').toUpperCase()}: ${r.event_title}`,
              body: r.status === 'pending'
                ? 'Your registration is awaiting faculty approval.'
                : r.status === 'rejected'
                  ? 'Your registration was not approved.'
                  : 'Your seat is confirmed.',
              priority: r.status === 'rejected' ? 'urgent' : 'normal',
              date: r.reviewed_at || r.registered_at
            })
          })
        }
        if (Array.isArray(invitations)) {
          invitations.forEach(inv => {
            list.push({
              id: `invite-${inv.id}`,
              invitationId: inv.id,
              type: 'team_invite',
              title: `Squad Invitation: ${inv.team_name}`,
              body: `You have been invited to join ${inv.team_name}. Accept to join the squad roster.`,
              priority: 'normal',
              date: inv.created_at
            })
          })
        }
        list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        if (active) setItems(list)
      } catch (e) {
        console.error(e)
        toast.error('Unable to load notifications.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const iconFor = (type, priority) => {
    if (type === 'announcement') return <Megaphone size={16} className="text-indigo-600" />
    if (priority === 'urgent') return <AlertTriangle size={16} className="text-rose-600" />
    return <Ticket size={16} className="text-emerald-600" />
  }

  if (loading) {
    return (
      <div className="flex h-[75vh] items-center justify-center flex-col gap-3">
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
        <p className="text-sm text-slate-500 font-medium">Loading notifications...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
        <p className="text-sm text-slate-500 mt-1">Announcements, registration updates and reminders.</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <Bell size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Notifications</h3>
          <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto">
            You're all caught up.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n, idx) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                {iconFor(n.type, n.priority)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{n.title}</h3>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{n.date ? new Date(n.date).toLocaleString() : ''}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.body}</p>
                {n.type === 'team_invite' && n.invitationId && (
                  <button
                    onClick={async () => {
                      setAcceptingId(n.invitationId)
                      try {
                        await acceptTeamInvitation(n.invitationId)
                        toast.success('Joined squad successfully.')
                        setItems(prev => prev.filter(item => item.invitationId !== n.invitationId))
                      } catch (error) {
                        toast.error('Unable to accept invitation.')
                      } finally {
                        setAcceptingId(null)
                      }
                    }}
                    disabled={acceptingId === n.invitationId}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {acceptingId === n.invitationId ? 'Accepting...' : 'Accept Invitation'}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
