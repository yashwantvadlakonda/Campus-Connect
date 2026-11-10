import { useEffect, useState } from 'react'
import {
  ShieldCheck, Plus, Loader2, X, Mail, AlertTriangle, CheckCircle2, Ban, KeyRound,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import {
  getFacultyAccounts, createFacultyAccount, setFacultyStatus, getCachedAdmin,
} from '../../services/adminApi'

const EMPTY = { full_name: '', email: '', password: '', role: 'faculty' }

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  suspended: 'bg-rose-50 text-rose-700 border-rose-200',
}

const ROLE_STYLES = {
  admin: 'bg-violet-50 text-violet-700 border-violet-200',
  faculty: 'bg-indigo-50 text-indigo-700 border-indigo-200',
}

export default function AdminFaculty() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const current = getCachedAdmin()

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setAccounts(await getFacultyAccounts())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const submit = async (event) => {
    event.preventDefault()
    if (form.full_name.trim().length < 2) { setFormError('Full name is required.'); return }
    if (!form.email.includes('@')) { setFormError('Enter a valid email address.'); return }
    if (form.password.length < 8) { setFormError('Password must be at least 8 characters.'); return }
    setSaving(true)
    setFormError(null)
    try {
      await createFacultyAccount({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      })
      toast.success(`${form.role === 'admin' ? 'Administrator' : 'Faculty'} account provisioned`)
      setModalOpen(false)
      setForm(EMPTY)
      load()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (account) => {
    const next = (account.status || 'active') === 'active' ? 'suspended' : 'active'
    setBusyId(account.id)
    try {
      await setFacultyStatus(account.id, next)
      setAccounts(prev => prev.map(item => item.id === account.id ? { ...item, status: next } : item))
      toast.success(next === 'active' ? `${account.email} reactivated` : `${account.email} suspended`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const fieldClass = 'w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
  const labelClass = 'block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 font-mono'

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[11px] font-semibold uppercase tracking-wider mb-2 font-mono">
            <ShieldCheck size={12} /> Role-based access
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">Faculty &amp; Admins</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Provision portal accounts. Only administrators can create or suspend credentials.
          </p>
        </div>
        <button
          onClick={() => { setForm(EMPTY); setFormError(null); setModalOpen(true) }}
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm shadow-indigo-500/20 transition-all active:scale-95"
        >
          <Plus size={15} /> Provision account
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-semibold">Account</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold text-right">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-14 text-center">
                    <Loader2 className="animate-spin text-indigo-500 mx-auto mb-2" size={24} />
                    <p className="text-xs text-slate-500">Loading portal accounts...</p>
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-14 text-center">
                    <ShieldCheck className="mx-auto text-slate-300 mb-2" size={30} />
                    <p className="text-sm font-semibold text-slate-700">No portal accounts yet</p>
                    <p className="text-xs text-slate-400 mt-1">Provision faculty or administrator credentials to get started.</p>
                  </td>
                </tr>
              ) : accounts.map(account => {
                const isSelf = current?.id === account.id
                return (
                  <motion.tr
                    key={account.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <p className="text-xs font-bold text-slate-900">
                        {account.full_name || account.email}
                        {isSelf && <span className="ml-1.5 text-[9px] font-mono uppercase text-indigo-600">(you)</span>}
                      </p>
                      <p className="text-[11px] text-slate-500 inline-flex items-center gap-1 mt-0.5">
                        <Mail size={10} /> {account.email}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${ROLE_STYLES[account.role] || ROLE_STYLES.faculty}`}>
                        {account.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${STATUS_STYLES[account.status] || STATUS_STYLES.active}`}>
                        {account.status || 'active'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[11px] text-slate-500 whitespace-nowrap">
                      {account.created_at ? new Date(account.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end">
                        {busyId === account.id ? (
                          <Loader2 size={15} className="animate-spin text-indigo-500" />
                        ) : (
                          <button
                            onClick={() => toggleStatus(account)}
                            disabled={isSelf}
                            title={isSelf ? 'You cannot suspend your own account' : (account.status === 'suspended' ? 'Reactivate' : 'Suspend')}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                              account.status === 'suspended'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                            }`}
                          >
                            {account.status === 'suspended' ? <CheckCircle2 size={11} /> : <Ban size={11} />}
                            {account.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => !saving && setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900">Provision portal account</h2>
                <p className="text-[11px] text-slate-500">Share the temporary password securely with the new member.</p>
              </div>
              <button onClick={() => setModalOpen(false)} disabled={saving} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" /> {formError}
                </div>
              )}
              <div>
                <label className={labelClass}>Full name</label>
                <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className={fieldClass} placeholder="Dr. Ananya Rao" />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={fieldClass} placeholder="faculty@university.edu" />
              </div>
              <div>
                <label className={labelClass}>Temporary password</label>
                <div className="relative">
                  <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={`${fieldClass} pl-9`} placeholder="At least 8 characters" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={fieldClass}>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-60">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm disabled:opacity-60">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Create account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
