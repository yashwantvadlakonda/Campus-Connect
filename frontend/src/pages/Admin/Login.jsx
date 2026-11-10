import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { adminSignIn } from '../../services/adminApi'
import { toast } from 'react-hot-toast'
import { ShieldCheck, ShieldAlert, Loader2, Lock, Mail, Sparkles, ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    try {
      await adminSignIn(email, password)
      toast.success('Faculty authorization granted')
      const redirectTo = location.state?.from || '/admin/dashboard'
      navigate(redirectTo, { replace: true })
    } catch (error) {
      const msg = error?.message || 'Access Denied: verified faculty credentials are required'
      setErrorMessage(msg)
      toast.error(msg, { duration: 5000 })
    } finally {
      setLoading(false)
    }
  }

  const fillDemoAdmin = () => {
    setEmail('faculty.admin@university.edu')
    setPassword('CampusAdmin2026!')
    setErrorMessage('')
    toast('Default administrator credentials filled', { icon: '🛡️' })
  }

  return (
    <div className="min-h-screen bg-slate-50 [background-image:radial-gradient(rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:24px_24px] text-slate-900 flex flex-col font-sans">
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md bg-white border border-slate-200 shadow-sm rounded-3xl p-8 sm:p-10"
        >
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mb-3 shadow-sm">
              <ShieldCheck size={28} />
            </div>
            <div className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 border border-violet-200 font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-full mb-2">
              FACULTY &amp; ADMIN PORTAL
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Faculty Console</h1>
            <p className="text-slate-500 text-xs mt-1.5 max-w-xs leading-relaxed">
              Restricted access for campus program management, student records and registration governance.
            </p>
          </div>

          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5"
              >
                <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <span className="font-bold block">Authorization Failed</span>
                  {errorMessage}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={fillDemoAdmin}
            className="w-full mb-5 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Sparkles size={14} className="text-indigo-600" />
            <span>Fill default administrator credentials</span>
          </button>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 font-mono">
                Faculty / Admin Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition-all"
                  placeholder="faculty.admin@university.edu"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errorMessage) setErrorMessage('')
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 font-mono">
                Account Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errorMessage) setErrorMessage('')
                  }}
                />
              </div>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2 text-[11px] text-amber-800">
              <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                No public signup. Faculty accounts are provisioned by an administrator from the
                Faculty &amp; Admin management screen.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm shadow-indigo-500/20 active:scale-95 transition-all mt-2 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Validating role...</span>
                </>
              ) : (
                <>
                  <span>Authenticate &amp; Open Console</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-5 border-t border-slate-100 text-center">
            <Link to="/login" className="text-slate-500 hover:text-indigo-600 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors">
              <ArrowLeft size={14} />
              <span>Return to Student Portal</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
