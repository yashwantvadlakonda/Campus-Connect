import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, KeyRound, Loader2, ArrowRight, AlertCircle } from 'lucide-react'
import { joinTeam } from '../../../services/api'
import { toast } from 'react-hot-toast'

export default function JoinTeamModal({ event, onClose, onTeamJoined }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const cleanCode = code.trim().toUpperCase()
    if (!cleanCode) {
      setError('Please enter a team invite code.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await joinTeam(cleanCode)
      if (res?.team) {
        toast.success(res.message || 'Successfully joined squad!', { icon: '🤝' })
        onTeamJoined(res.team)
      } else {
        throw new Error('Team not found or code expired')
      }
    } catch (err) {
      setError(err?.message || 'Could not join team. Please check the code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col mx-auto"
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh] overflow-hidden">
          {/* Sticky Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 z-10 p-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Join a Squad</h3>
                <p className="text-xs text-slate-500">
                  {event?.title || 'Campus Event Squad'}
                </p>
              </div>
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

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 font-medium">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-mono">
                Team Invite Code *
              </label>
              <input
                type="text"
                required
                maxLength={12}
                placeholder="e.g. CAMP-9X42"
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null); }}
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-center text-lg font-mono font-bold tracking-widest text-indigo-700 uppercase placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
              Enter the unique invite code shared by your Team Lead. Once verified, you will be enrolled into the team roster for <strong className="text-slate-900">{event?.title}</strong>.
            </div>
          </div>

          {/* Sticky Footer */}
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
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shadow-indigo-500/20 active:scale-95 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Validating Code...</span>
                </>
              ) : (
                <>
                  <span>Join Squad</span>
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
