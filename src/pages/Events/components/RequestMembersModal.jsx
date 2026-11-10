import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Search, Filter, UserPlus, Check, Sparkles, Tag, Shield, Building2, Loader2 } from 'lucide-react'
import { getEventParticipants, inviteTeamMember } from '../../../services/api'
import { toast } from 'react-hot-toast'

export default function RequestMembersModal({ event, team, onClose, onInviteSent }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSkill, setSelectedSkill] = useState('All')
  const [invitedIds, setInvitedIds] = useState(() => {
    const existing = team?.invitations?.map(i => i.receiver_id) || []
    return new Set(existing)
  })
  const [invitingId, setInvitingId] = useState(null)

  useEffect(() => {
    getEventParticipants(event.id)
      .then(data => setStudents(data || []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false))
  }, [event.id])

  const skillsList = ['All', 'React', 'Python', 'FastAPI', 'UI/UX', 'PostgreSQL', 'AI/ML', 'Docker']

  const existingMemberIds = new Set(team?.members?.map(m => m.student_id) || [])

  const filteredStudents = students.filter(student => {
    if (existingMemberIds.has(student.id)) return false
    const matchesSearch = 
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.email.toLowerCase().includes(search.toLowerCase()) ||
      student.skills?.some(s => s.toLowerCase().includes(search.toLowerCase()))
    const matchesSkill = selectedSkill === 'All' || student.skills?.includes(selectedSkill)
    return matchesSearch && matchesSkill
  })

  const handleSendInvite = async (student) => {
    setInvitingId(student.id)
    try {
      await inviteTeamMember(team.id, student.id)
      setInvitedIds(prev => new Set([...prev, student.id]))
      toast.success(`Invite dispatched to ${student.name}!`, { icon: '📨' })
      if (onInviteSent) onInviteSent(student)
    } catch (err) {
      toast.error('Could not send invite')
    } finally {
      setInvitingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-20 flex flex-col mx-auto"
      >
        {/* 1. Sticky Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 z-10 p-5 flex items-center justify-between shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-1">
              <Sparkles size={11} />
              <span>Campus Directory</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              Request Squad Members
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Recruiting for: <span className="font-semibold text-slate-800">"{team.name}"</span>
            </p>
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

        {/* 2. Search & Skill Filters (Pinned Bar) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search participants by student name, major, or tech stack..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 bg-white border border-slate-200 rounded-xl pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-semibold text-slate-500 shrink-0 mr-1 flex items-center gap-1">
              <Filter size={12} /> Filter:
            </span>
            {skillsList.map(skill => (
              <button
                type="button"
                key={skill}
                onClick={() => setSelectedSkill(skill)}
                className={`text-[11px] px-3 py-1 rounded-lg font-semibold transition-all shrink-0 ${
                  selectedSkill === skill
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Scrollable Directory List */}
        <div className="p-6 space-y-3.5 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
              <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
              <p className="text-xs">Finding registered campus participants...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-sm font-semibold">No participants found</p>
              <p className="text-xs text-slate-400 mt-1">Try tweaking your search term or skill filter.</p>
            </div>
          ) : (
            filteredStudents.map(student => {
              const isInvited = invitedIds.has(student.id)
              const isInviting = invitingId === student.id

              return (
                <div
                  key={student.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-900 text-sm">{student.name}</h4>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium font-mono">
                        {student.branch} • Year {student.year}
                      </span>
                      {student.matchScore && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                          {student.matchScore} Match
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-1">{student.bio}</p>

                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {student.skills?.map(s => (
                        <span
                          key={s}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50/70 text-indigo-700 border border-indigo-100"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="shrink-0 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleSendInvite(student)}
                      disabled={isInvited || isInviting}
                      className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isInvited
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs active:scale-95'
                      }`}
                    >
                      {isInviting ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : isInvited ? (
                        <>
                          <Check size={13} />
                          <span>Invited ✓</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={13} />
                          <span>Send Invite</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* 4. Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 z-10 p-4 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Done Recruiting
          </button>
        </div>
      </motion.div>
    </div>
  )
}
