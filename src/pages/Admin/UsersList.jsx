import { useEffect, useMemo, useState } from 'react'
import {
  Search, Loader2, GraduationCap, Users, X, Mail, Building2,
  Calendar, CheckCircle2, Ban, ChevronLeft, ChevronRight, ShieldAlert, Layers,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { getAdminUsers, setStudentStatus, getCachedAdmin } from '../../services/adminApi'

const PAGE_SIZE = 10

function monogram(name) {
  if (!name) return 'ST'
  const parts = name.trim().split(/\s+/)
  return (parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase()
}

export default function AdminUsersList() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [branch, setBranch] = useState('All')
  const [year, setYear] = useState('All')
  const [skill, setSkill] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const admin = getCachedAdmin()
  const canManageStatus = admin?.role === 'admin'

  const load = async () => {
    setLoading(true)
    try {
      setUsers(await getAdminUsers())
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const branches = useMemo(() => ['All', ...new Set(users.map(u => u.branch).filter(Boolean))], [users])
  const skills = useMemo(() => {
    const counts = {}
    users.forEach(user => (user.skills || []).forEach(item => { counts[item] = (counts[item] || 0) + 1 }))
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name]) => name)
  }, [users])

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim()
    return users.filter(user => {
      const matchesSearch = !term
        || user.full_name?.toLowerCase().includes(term)
        || user.email?.toLowerCase().includes(term)
        || (user.skills || []).some(item => item.toLowerCase().includes(term))
      const matchesBranch = branch === 'All' || user.branch === branch
      const matchesYear = year === 'All' || String(user.year) === String(year)
      const matchesSkill = !skill || (user.skills || []).includes(skill)
      const matchesStatus = status === 'all' || (user.status || 'active') === status
      return matchesSearch && matchesBranch && matchesYear && matchesSkill && matchesStatus
    })
  }, [users, search, branch, year, skill, status])

  useEffect(() => { setPage(1) }, [search, branch, year, skill, status])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleStatus = async (user) => {
    const next = (user.status || 'active') === 'active' ? 'suspended' : 'active'
    setBusyId(user.id)
    try {
      await setStudentStatus(user.id, next)
      setUsers(prev => prev.map(item => item.id === user.id ? { ...item, status: next } : item))
      if (selected?.id === user.id) setSelected({ ...selected, status: next })
      toast.success(next === 'active' ? `${user.full_name} reactivated` : `${user.full_name} suspended`)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[11px] font-semibold uppercase tracking-wider mb-2 font-mono">
            <GraduationCap size={12} /> Student records
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">Student Directory</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search profiles, inspect skills and participation, and manage account access.
          </p>
        </div>
        <span className="text-xs font-mono font-semibold bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-xl">
          Total students: <strong className="text-slate-900">{users.length}</strong>
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or skill..."
              className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <select value={branch} onChange={e => setBranch(e.target.value)} className="h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
            {branches.map(item => <option key={item} value={item}>{item === 'All' ? 'All branches' : item}</option>)}
          </select>
          <select value={year} onChange={e => setYear(e.target.value)} className="h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
            {['All', '1', '2', '3', '4', 'Graduate Student'].map(item => (
              <option key={item} value={item}>{item === 'All' ? 'All years' : item === 'Graduate Student' ? item : `Year ${item}`}</option>
            ))}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)} className="h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        {skills.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mr-1">Skill</span>
            <button onClick={() => setSkill('')} className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${!skill ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
              All
            </button>
            {skills.map(item => (
              <button key={item} onClick={() => setSkill(skill === item ? '' : item)} className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition-colors ${skill === item ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700'}`}>
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Branch</th>
                <th className="px-4 py-3 font-semibold">Year</th>
                <th className="px-4 py-3 font-semibold">Skills</th>
                <th className="px-4 py-3 font-semibold">Participation</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-14 text-center">
                    <Loader2 className="animate-spin text-indigo-500 mx-auto mb-2" size={24} />
                    <p className="text-xs text-slate-500">Loading student records...</p>
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-14 text-center">
                    <Users className="mx-auto text-slate-300 mb-2" size={30} />
                    <p className="text-sm font-semibold text-slate-700">No students match these filters</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing the search or filters.</p>
                  </td>
                </tr>
              ) : pageRows.map(user => (
                <tr key={user.id} onClick={() => setSelected(user)} className="hover:bg-slate-50/80 transition-colors cursor-pointer group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {monogram(user.full_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 truncate">{user.full_name || 'Student'}</p>
                        <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md font-mono">
                      {user.branch || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-600">{user.year ? (/^\d+$/.test(user.year) ? `Year ${user.year}` : user.year) : '—'}</td>
                  <td className="px-4 py-3 max-w-[230px]">
                    <div className="flex flex-wrap gap-1">
                      {(user.skills || []).slice(0, 3).map(item => (
                        <span key={item} className="text-[9px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded font-medium">{item}</span>
                      ))}
                      {(user.skills || []).length > 3 && <span className="text-[9px] text-slate-400 self-center">+{user.skills.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-600">
                    <span className="inline-flex items-center gap-1"><Layers size={11} className="text-slate-400" />{user.participation_count || 0} programs</span>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => canManageStatus && toggleStatus(user)}
                      disabled={!canManageStatus || busyId === user.id}
                      title={canManageStatus ? 'Toggle account status' : 'Administrator access required'}
                      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        (user.status || 'active') === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      } ${canManageStatus ? 'hover:opacity-80' : 'cursor-default'}`}
                    >
                      {busyId === user.id ? <Loader2 size={10} className="animate-spin" /> : (user.status === 'suspended' ? <Ban size={10} /> : <CheckCircle2 size={10} />)}
                      {user.status || 'active'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right text-[10px] text-slate-400 font-mono whitespace-nowrap">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <p className="text-[11px] text-slate-500">
            {filtered.length === 0 ? 'No records' : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
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

      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => setSelected(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-sm">
                    {monogram(selected.full_name)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{selected.full_name}</h3>
                    <p className="text-[11px] text-slate-500 inline-flex items-center gap-1"><Mail size={10} /> {selected.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100" aria-label="Close">
                  <X size={17} />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Branch</p>
                    <p className="font-semibold text-slate-800 mt-0.5 inline-flex items-center gap-1"><Building2 size={11} /> {selected.branch || '—'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Year</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{selected.year || '—'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Participation</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{selected.participation_count || 0} programs</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Joined</p>
                    <p className="font-semibold text-slate-800 mt-0.5 inline-flex items-center gap-1"><Calendar size={11} /> {selected.created_at ? new Date(selected.created_at).toLocaleDateString() : '—'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5 font-mono">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(selected.skills || []).length === 0 ? <span className="text-xs text-slate-400">No skills listed</span> : selected.skills.map(item => (
                      <span key={item} className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-lg font-medium">{item}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5 font-mono">Interests</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(selected.interests || []).length === 0 ? <span className="text-xs text-slate-400">No interests listed</span> : selected.interests.map(item => (
                      <span key={item} className="text-[10px] bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-lg font-medium">{item}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5 font-mono">Bio</p>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3">
                    {selected.bio || 'No bio provided.'}
                  </p>
                </div>

                {canManageStatus && (
                  <button
                    onClick={() => toggleStatus(selected)}
                    disabled={busyId === selected.id}
                    className={`w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition-colors disabled:opacity-60 ${
                      (selected.status || 'active') === 'active'
                        ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {selected.status === 'suspended' ? <CheckCircle2 size={14} /> : <Ban size={14} />}
                    {selected.status === 'suspended' ? 'Reactivate account' : 'Suspend account'}
                  </button>
                )}
                {!canManageStatus && (
                  <p className="text-[10px] text-slate-400 inline-flex items-center gap-1"><ShieldAlert size={11} /> Only administrators can change account status.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
