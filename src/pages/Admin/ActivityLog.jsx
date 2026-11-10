import { useEffect, useState } from 'react'
import {
  ScrollText, Loader2, RefreshCw, Plus, Pencil, Trash2, Send, Ban, CheckCircle2, ShieldCheck,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getActivityLogs } from '../../services/adminApi'

const LIMIT = 50

function iconFor(log) {
  const action = (log.action || '').toLowerCase()
  if (action.includes('deleted') || action.includes('purged')) return Trash2
  if (action.includes('created')) return Plus
  if (action.includes('updated') || action.includes('edited')) return Pencil
  if (action.includes('published')) return Send
  if (action.includes('suspended')) return Ban
  if (action.includes('approved')) return CheckCircle2
  if (action.includes('archived')) return ScrollText
  if (action.includes('status')) return CheckCircle2
  return ShieldCheck
}

function formatWhen(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function AdminActivityLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const data = await getActivityLogs(LIMIT)
      setLogs(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
      if (isRefresh) toast.error(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[11px] font-semibold uppercase tracking-wider mb-2 font-mono">
            <ScrollText size={12} /> Audit trail
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">Activity Log</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Every published program, reviewed registration and account change recorded by the portal.
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error && !logs.length ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-14 text-center">
          <p className="text-sm font-semibold text-slate-700">Unable to load activity</p>
          <p className="text-xs text-slate-500 mt-1">{error}</p>
        </div>
      ) : loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center">
          <Loader2 className="animate-spin text-indigo-500 mx-auto mb-2" size={24} />
          <p className="text-xs text-slate-500">Loading audit trail...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center">
          <ScrollText className="mx-auto text-slate-300 mb-2" size={30} />
          <p className="text-sm font-semibold text-slate-700">No activity recorded yet</p>
          <p className="text-xs text-slate-400 mt-1">Publishing a program or reviewing a registration will appear here.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {logs.map((log, index) => {
            const Icon = iconFor(log)
            const message = [log.actor_email || 'System', log.action, log.entity_type || 'record', log.detail].filter(Boolean).join(' ')
            return (
              <div
                key={log.id}
                title={message}
                className={`flex items-start sm:items-center gap-3 px-4 sm:px-5 py-3 min-h-[56px] hover:bg-slate-50 transition-colors ${index !== logs.length - 1 ? 'border-b border-slate-100' : ''}`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                  <Icon size={14} />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
                    <span className="text-sm font-semibold text-slate-900 truncate max-w-full">{log.actor_email || 'System'}</span>
                    <span className="text-sm text-slate-600 truncate">{log.action}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded shrink-0">
                      {log.entity_type || 'record'}
                    </span>
                  </div>
                  {log.detail && (
                    <p className="text-sm text-slate-500 truncate" title={log.detail}>{log.detail}</p>
                  )}
                  {log.entity_id && (
                    <p className="text-[11px] text-slate-400 font-mono truncate" title={log.entity_id}>{log.entity_id}</p>
                  )}
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap shrink-0 self-start sm:self-center">{formatWhen(log.created_at)}</span>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-[11px] text-slate-400 text-center">Showing the most recent {LIMIT} events.</p>
    </div>
  )
}
