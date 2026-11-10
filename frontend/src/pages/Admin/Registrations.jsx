import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search, Loader2, Download, Check, X, Clock, Users, Ticket,
  ClipboardList, ChevronLeft, ChevronRight, Mail, Building2, CalendarDays,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  getAdminRegistrations, setRegistrationStatus, downloadRegistrationsCsv, getAdminEvents,
} from '../../services/adminApi'

const PAGE_SIZE = 10

const STATUS_STYLES = {
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
}

export default function AdminRegistrations() {
  const [searchParams] = useSearchParams()
  const [rows, setRows] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState(searchParams.get('status') || 'all')
  const [eventId, setEventId] = useState(searchParams.get('event') || '')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    getAdminEvents({ page: 1, pageSize: 100 })
      .then(data => setEvents(data.items || []))
      .catch(() => {})
  }, [])

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
      const data = await getAdminRegistrations({ eventId, status, search: query })
      setRows(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [eventId, status, query])

  const review = async (registration, nextStatus) => {
    setBusyId(registration.id)
    try {
      await setRegistrationStatus(registration.id, nextStatus)
      setRows(prev => prev.map(row => row.id === registration.id ? { ...row, status: nextStatus } : row))
      toast.success(
        nextStatus === 'approved'
          ? `Approved ${registration.student_name}`
          : `Rejected ${registration.student_name}`
      )
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusyId(null)
    }
  }

  const handleExport = async () => {
    try {
      await downloadRegistrationsCsv({ eventId, status })
      toast.success('Registration data exported')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const counts = useMemo(() => ({
    pending: rows.filter(row => row.status === 'pending').length,
    approved: rows.filter(row => row.status === 'approved').length,
    rejected: rows.filter(row => row.status === 'rejected').length,
  }), [rows])

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [pageCount, page])

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[11px] font-semibold uppercase tracking-wider mb-2 font-mono">
            <ClipboardList size={12} /> Registration governance
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">Registrations</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review applications, inspect team details and export registration data.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: rows.length, icon: Ticket, tone: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
          { label: 'Pending', value: counts.pending, icon: Clock, tone: 'text-amber-600 bg-amber-50 border-amber-100' },
          { label: 'Approved', value: counts.approved, icon: Check, tone: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Rejected', value: counts.rejected, icon: X, tone: 'text-rose-600 bg-rose-50 border-rose-100' },
        ].map(item => (
          <div key={item.label} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${item.tone}`}><item.icon size={16} /></div>
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">{item.label}</p>
              <p className="text-xl font-extrabold text-slate-900">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search student, email or program..."
            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        <select
          value={eventId}
          onChange={e => { setEventId(e.target.value); setPage(1) }}
          className="h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 max-w-full lg:max-w-[260px]"
        >
          <option value="">All programs</option>
          {events.map(event => (
            <option key={event.id} value={event.id}>{event.title}</option>
          ))}
        </select>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start">
          {['all', 'pending', 'approved', 'rejected'].map(value => (
            <button
              key={value}
              onClick={() => { setStatus(value); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all ${
                status === value ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Program</th>
                <th className="px-4 py-3 font-semibold">Team / Details</th>
                <th className="px-4 py-3 font-semibold">Registered</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-14 text-center">
                    <Loader2 className="animate-spin text-indigo-500 mx-auto mb-2" size={24} />
                    <p className="text-xs text-slate-500">Loading registrations...</p>
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-14 text-center">
                    <ClipboardList className="mx-auto text-slate-300 mb-2" size={30} />
                    <p className="text-sm font-semibold text-slate-700">No registrations match these filters</p>
                    <p className="text-xs text-slate-400 mt-1">Student applications will appear here as they register.</p>
                  </td>
                </tr>
              ) : pageRows.map(row => {
                const detailEntries = Object.entries(row.credentials || {}).filter(([, value]) => value)
                return (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors align-top">
                    <td className="px-4 py-3.5">
                      <p className="text-xs font-bold text-slate-900">{row.student_name}</p>
                      <p className="text-[11px] text-slate-500 inline-flex items-center gap-1 mt-0.5">
                        <Mail size={10} /> {row.student_email || '—'}
                      </p>
                      {(row.branch || row.year) && (
                        <p className="text-[10px] text-slate-400 mt-0.5 inline-flex items-center gap-1">
                          <Building2 size={10} /> {[row.branch, row.year && `Year ${row.year}`].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 max-w-[220px]">
                      <p className="text-xs font-semibold text-slate-800 truncate">{row.event_title}</p>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-violet-600">{row.event_type}</span>
                    </td>
                    <td className="px-4 py-3.5 max-w-[260px]">
                      {row.team?.name || row.team_name ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                          <Users size={11} /> {row.team?.name || row.team_name}
                          {row.team?.team_code ? ` · ${row.team.team_code}` : ''}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Individual</span>
                      )}
                      {detailEntries.length > 0 && (
                        <div className="mt-1.5 space-y-0.5">
                          {detailEntries.slice(0, 3).map(([key, value]) => (
                            <p key={key} className="text-[10px] text-slate-500 truncate">
                              <span className="font-semibold text-slate-600">{key}:</span> {String(value)}
                            </p>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[11px] text-slate-600 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={11} className="text-slate-400" />
                        {row.registered_at ? new Date(row.registered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${STATUS_STYLES[row.status] || STATUS_STYLES.pending}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {busyId === row.id ? (
                          <Loader2 size={15} className="animate-spin text-indigo-500" />
                        ) : (
                          <>
                            {row.status !== 'approved' && (
                              <button
                                onClick={() => review(row, 'approved')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold hover:bg-emerald-100"
                                title="Approve registration"
                              >
                                <Check size={11} /> Approve
                              </button>
                            )}
                            {row.status !== 'rejected' && (
                              <button
                                onClick={() => review(row, 'rejected')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold hover:bg-rose-100"
                                title="Reject registration"
                              >
                                <X size={11} /> Reject
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <p className="text-[11px] text-slate-500">
            {rows.length === 0 ? 'No records' : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, rows.length)} of ${rows.length}`}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40" aria-label="Previous page">
              <ChevronLeft size={14} />
            </button>
            <span className="text-[11px] font-semibold text-slate-600 px-2">{page} / {pageCount}</span>
            <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page >= pageCount} className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40" aria-label="Next page">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
