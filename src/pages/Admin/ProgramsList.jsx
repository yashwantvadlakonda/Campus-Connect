import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Search, Loader2, Edit2, Trash2, Trophy, CalendarDays, MapPin,
  Users, Eye, EyeOff, Archive, AlertTriangle, ChevronLeft, ChevronRight,
  Sparkles, Ticket,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import EventModal from './EventModal'
import { getAdminEvents, createEvent, updateEvent, deleteEvent, setEventStatus } from '../../services/adminApi'

const PAGE_SIZE = 8

const STATUS_STYLES = {
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  archived: 'bg-slate-100 text-slate-600 border-slate-200',
}

export default function ProgramsList({ type = 'hackathon' }) {
  const isHackathon = type === 'hackathon'
  const label = isHackathon ? 'Hackathon' : 'Event'
  const plural = isHackathon ? 'Hackathons' : 'Events'

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuery(search.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(timeout)
  }, [search])

  const load = async () => {
    setLoading(true)
    try {
      const data = await getAdminEvents({ status, type, search: query, page, pageSize: PAGE_SIZE })
      setRows(data.items || [])
      setTotal(data.total || 0)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [status, type, query, page])

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleSave = async (payload) => {
    if (editing) {
      await updateEvent(editing.id, payload)
      toast.success(`${label} updated`)
    } else {
      await createEvent(payload)
      toast.success(payload.status === 'published' ? `${label} published to the student dashboard` : `${label} saved as draft`)
    }
    setModalOpen(false)
    setEditing(null)
    load()
  }

  const handleStatus = async (event, nextStatus, verb) => {
    setBusyId(event.id)
    try {
      await setEventStatus(event.id, nextStatus)
      toast.success(`${label} ${verb}`)
      load()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setBusyId(deleteTarget.id)
    try {
      await deleteEvent(deleteTarget.id)
      toast.success(`${label} deleted with all registrations`)
      setDeleteTarget(null)
      if (rows.length === 1 && page > 1) setPage(page - 1)
      else load()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusyId(null)
    }
  }

  const statusTabs = useMemo(() => ([
    { key: 'all', label: 'All' },
    { key: 'published', label: 'Published' },
    { key: 'draft', label: 'Drafts' },
    { key: 'archived', label: 'Archived' },
  ]), [])

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[11px] font-semibold uppercase tracking-wider mb-2 font-mono">
            {isHackathon ? <Trophy size={12} /> : <CalendarDays size={12} />}
            Program orchestration
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">{plural}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isHackathon
              ? 'Draft, publish and track hackathons. Published programs sync instantly to student dashboards.'
              : 'Manage workshops, seminars and competitions with live registration tracking.'}
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm shadow-indigo-500/20 transition-all active:scale-95"
        >
          <Plus size={15} />
          New {label}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${plural.toLowerCase()} by title or organizer...`}
            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto">
          {statusTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setStatus(tab.key); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                status === tab.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-semibold">Program</th>
                <th className="px-4 py-3 font-semibold">Schedule</th>
                <th className="px-4 py-3 font-semibold">Venue</th>
                <th className="px-4 py-3 font-semibold">Registrations</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-14 text-center">
                    <Loader2 className="animate-spin text-indigo-500 mx-auto mb-2" size={24} />
                    <p className="text-xs text-slate-500">Loading {plural.toLowerCase()}...</p>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-14 text-center">
                    <div className="text-slate-400 mb-2 flex justify-center">
                      {isHackathon ? <Trophy size={30} /> : <CalendarDays size={30} />}
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No {plural.toLowerCase()} found</p>
                    <p className="text-xs text-slate-400 mt-1">Create one to make it available on the student dashboard.</p>
                  </td>
                </tr>
              ) : rows.map(event => {
                const isBusy = busyId === event.id
                const fill = Math.min(100, Math.round(((event.registered || 0) / (event.capacity || 1)) * 100))
                return (
                  <motion.tr
                    key={event.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50/70 transition-colors align-top"
                  >
                    <td className="px-4 py-3.5 max-w-[280px]">
                      <div className="flex items-start gap-2.5">
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                          isHackathon ? 'bg-violet-50 border-violet-100 text-violet-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                        }`}>
                          {isHackathon ? <Trophy size={14} /> : <CalendarDays size={14} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{event.title}</p>
                          <p className="text-[11px] text-slate-500 truncate">{event.club}</p>
                          {event.themes?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {event.themes.slice(0, 3).map(theme => (
                                <span key={theme} className="text-[9px] font-medium bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                                  {theme}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[11px] text-slate-600 whitespace-nowrap">
                      <p className="font-medium text-slate-800">{event.event_date || event.start_at?.slice(0, 10) || 'TBD'}</p>
                      <p className="text-slate-400 mt-0.5">Closes {event.deadline_at?.slice(0, 10) || 'open'}</p>
                    </td>
                    <td className="px-4 py-3.5 text-[11px] text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={11} className="text-slate-400" />
                        {event.venue_name || 'Campus'}
                      </span>
                      <p className="text-slate-400 mt-0.5">{event.participation_mode}</p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                        <Ticket size={12} className="text-slate-400" />
                        {event.registered || 0} / {event.capacity}
                      </div>
                      <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div className={`h-1.5 rounded-full ${fill >= 90 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${fill}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${STATUS_STYLES[event.status] || STATUS_STYLES.draft}`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {isBusy ? (
                          <Loader2 size={16} className="animate-spin text-indigo-500" />
                        ) : (
                          <>
                            {event.status === 'published' ? (
                              <button onClick={() => handleStatus(event, 'draft', 'unpublished')} title="Unpublish" className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50">
                                <EyeOff size={14} />
                              </button>
                            ) : (
                              <button onClick={() => handleStatus(event, 'published', 'published')} title="Publish" className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50">
                                <Eye size={14} />
                              </button>
                            )}
                            {event.status !== 'archived' && (
                              <button onClick={() => handleStatus(event, 'archived', 'archived')} title="Archive" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                                <Archive size={14} />
                              </button>
                            )}
                            <button onClick={() => { setEditing(event); setModalOpen(true) }} title="Edit" className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => setDeleteTarget(event)} title="Delete" className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <p className="text-[11px] text-slate-500">
            {total === 0 ? 'No records' : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[11px] font-semibold text-slate-600 px-2">{page} / {pageCount}</span>
            <button
              onClick={() => setPage(p => Math.min(pageCount, p + 1))}
              disabled={page >= pageCount}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link to="/admin/registrations" className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-indigo-300 transition-colors flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100"><Users size={16} /></div>
          <div>
            <p className="text-xs font-bold text-slate-800">Review registrations</p>
            <p className="text-[11px] text-slate-500">Approve, reject and export</p>
          </div>
        </Link>
        <Link to="/admin/analytics" className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-indigo-300 transition-colors flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-50 text-violet-600 border border-violet-100"><Sparkles size={16} /></div>
          <div>
            <p className="text-xs font-bold text-slate-800">Engagement analytics</p>
            <p className="text-[11px] text-slate-500">Department participation</p>
          </div>
        </Link>
        <Link to="/admin/announcements" className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-indigo-300 transition-colors flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600 border border-cyan-100"><CalendarDays size={16} /></div>
          <div>
            <p className="text-xs font-bold text-slate-800">Announce to students</p>
            <p className="text-[11px] text-slate-500">Target department & year</p>
          </div>
        </Link>
      </div>

      {modalOpen && (
        <EventModal
          event={editing}
          defaultType={type}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-sm">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle size={19} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete {label.toLowerCase()}?</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              <span className="font-semibold text-slate-700">{deleteTarget.title}</span> and all of its registrations will be permanently removed. This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={busyId === deleteTarget.id} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-60">
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
