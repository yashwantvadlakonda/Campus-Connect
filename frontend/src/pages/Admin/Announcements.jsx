import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Megaphone, Plus, Loader2, Pencil, Trash2, Eye, EyeOff, X, AlertTriangle, Send,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  getAdminAnnouncements, createAnnouncement, updateAnnouncement,
  setAnnouncementStatus, deleteAnnouncement,
} from '../../services/adminApi'

const EMPTY = { title: '', body: '', department: 'All', year: 'All', priority: 'normal', status: 'draft' }

const PRIORITY_STYLES = {
  normal: 'bg-slate-100 text-slate-600 border-slate-200',
  important: 'bg-amber-50 text-amber-700 border-amber-200',
  urgent: 'bg-rose-50 text-rose-700 border-rose-200',
}

const DEPARTMENTS = ['All', 'CSE', 'AIML', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Data Science', 'Administration']
const YEARS = ['All', '1', '2', '3', '4', 'Graduate Student']

export default function AdminAnnouncements() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      setItems(await getAdminAnnouncements())
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      title: item.title, body: item.body, department: item.department || 'All',
      year: item.year || 'All', priority: item.priority || 'normal', status: item.status || 'draft',
    })
    setError(null)
    setModalOpen(true)
  }

  const submit = async (nextStatus) => {
    if (form.title.trim().length < 3) { setError('Title must be at least 3 characters.'); return }
    if (form.body.trim().length < 3) { setError('Announcement content is required.'); return }
    setSaving(true)
    setError(null)
    try {
      const payload = { ...form, title: form.title.trim(), body: form.body.trim(), status: nextStatus }
      if (editing) {
        await updateAnnouncement(editing.id, payload)
        toast.success(nextStatus === 'published' ? 'Announcement updated & published' : 'Announcement saved')
      } else {
        await createAnnouncement(payload)
        toast.success(nextStatus === 'published' ? 'Announcement published to students' : 'Announcement saved as draft')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (item) => {
    const next = item.status === 'published' ? 'draft' : 'published'
    setBusyId(item.id)
    try {
      await setAnnouncementStatus(item.id, next)
      toast.success(next === 'published' ? 'Announcement published' : 'Announcement unpublished')
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    setBusyId(deleteTarget.id)
    try {
      await deleteAnnouncement(deleteTarget.id)
      toast.success('Announcement deleted')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const fieldClass = 'w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[11px] font-semibold uppercase tracking-wider mb-2 font-mono">
            <Megaphone size={12} /> Campus communication
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">Announcements</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Publish targeted notices to student dashboards by department and academic year.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm shadow-indigo-500/20 transition-all active:scale-95"
        >
          <Plus size={15} /> New Announcement
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center">
          <Loader2 className="animate-spin text-indigo-500 mx-auto mb-2" size={24} />
          <p className="text-xs text-slate-500">Loading announcements...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center">
          <Megaphone className="mx-auto text-slate-300 mb-2" size={32} />
          <p className="text-sm font-semibold text-slate-700">No announcements yet</p>
          <p className="text-xs text-slate-400 mt-1">Published announcements appear on the student dashboard instantly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.normal}`}>
                      {item.priority}
                    </span>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      item.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {item.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.department} · Year {item.year}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {busyId === item.id ? (
                    <Loader2 size={15} className="animate-spin text-indigo-500" />
                  ) : (
                    <>
                      <button onClick={() => toggleStatus(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" title={item.status === 'published' ? 'Unpublish' : 'Publish'}>
                        {item.status === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteTarget(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mt-2 whitespace-pre-line line-clamp-4">{item.body}</p>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                {item.published_at && <span>published {new Date(item.published_at).toLocaleDateString()}</span>}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => !saving && setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900">{editing ? 'Edit announcement' : 'New announcement'}</h2>
                <p className="text-[11px] text-slate-500">Published notices appear on targeted student dashboards.</p>
              </div>
              <button onClick={() => setModalOpen(false)} disabled={saving} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" /> {error}
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 font-mono">Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={fieldClass} placeholder="Registrations close Friday" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 font-mono">Message *</label>
                <textarea
                  value={form.body}
                  onChange={e => setForm({ ...form, body: e.target.value })}
                  rows={5}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Share the details students need to know..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 font-mono">Department</label>
                  <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className={fieldClass}>
                    {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 font-mono">Year</label>
                  <select value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} className={fieldClass}>
                    {YEARS.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 font-mono">Priority</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className={fieldClass}>
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-end gap-2">
              <button onClick={() => submit('draft')} disabled={saving} className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 disabled:opacity-60">
                Save draft
              </button>
              <button onClick={() => submit('published')} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm disabled:opacity-60">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-sm">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle size={19} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete announcement?</h3>
            <p className="text-xs text-slate-500 mt-1">“{deleteTarget.title}” will be removed from the student dashboard.</p>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50">Cancel</button>
              <button onClick={confirmDelete} disabled={busyId === deleteTarget.id} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-60">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
