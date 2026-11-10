import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  Users, Trophy, CalendarDays, Ticket, Clock, Loader2, RefreshCw,
  Plus, Megaphone, ClipboardList, ArrowUpRight, TrendingUp, Building2,
  CheckCircle2, Sparkles, ShieldCheck, Activity,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts'
import { getAdminDashboardStats, getCachedAdmin } from '../../services/adminApi'

const EMPTY_STATS = {
  totalStudents: 0,
  activeHackathons: 0,
  upcomingEvents: 0,
  totalRegistrations: 0,
  pendingApprovals: 0,
  registrationVelocity: [],
  departmentParticipation: [],
  recentActivity: [],
  eventCapacities: [],
}

function relativeTime(value) {
  if (!value) return ''
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(EMPTY_STATS)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const admin = getCachedAdmin()

  const load = async (showToast = false) => {
    try {
      const data = await getAdminDashboardStats()
      setStats({ ...EMPTY_STATS, ...data })
      if (showToast) toast.success('Dashboard synchronized with the database')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const cards = [
    { title: 'Registered Students', value: stats.totalStudents, subtitle: 'Active student accounts', icon: Users, tone: 'text-indigo-600 bg-indigo-50 border-indigo-100', link: '/admin/users' },
    { title: 'Active Hackathons', value: stats.activeHackathons, subtitle: 'Published & open', icon: Trophy, tone: 'text-violet-600 bg-violet-50 border-violet-100', link: '/admin/hackathons' },
    { title: 'Upcoming Events', value: stats.upcomingEvents, subtitle: 'Scheduled campus events', icon: CalendarDays, tone: 'text-cyan-600 bg-cyan-50 border-cyan-100', link: '/admin/events' },
    { title: 'Total Registrations', value: stats.totalRegistrations, subtitle: 'Across all programs', icon: Ticket, tone: 'text-emerald-600 bg-emerald-50 border-emerald-100', link: '/admin/registrations' },
    { title: 'Pending Approvals', value: stats.pendingApprovals, subtitle: 'Awaiting faculty review', icon: Clock, tone: 'text-amber-600 bg-amber-50 border-amber-100', link: '/admin/registrations?status=pending' },
  ]

  const velocity = stats.registrationVelocity || []
  const departments = (stats.departmentParticipation || []).slice(0, 8)
  const activity = stats.recentActivity || []
  const capacities = (stats.eventCapacities || []).slice(0, 5)

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[11px] font-semibold uppercase tracking-wider mb-2 font-mono">
            <ShieldCheck size={13} />
            {admin?.role === 'admin' ? 'Administrator access' : 'Faculty access'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">
            Welcome back, {admin?.full_name?.split(' ')[0] || 'Faculty'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Live campus operations, approvals and program telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setRefreshing(true); load(true) }}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all active:scale-95 disabled:opacity-60"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-indigo-600' : ''} />
            Refresh
          </button>
          <Link
            to="/admin/hackathons"
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm shadow-indigo-500/20 transition-all active:scale-95"
          >
            <Plus size={15} />
            New Hackathon
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {cards.map(card => (
          <Link
            key={card.title}
            to={card.link}
            className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl border ${card.tone}`}>
                <card.icon size={19} />
              </div>
              <ArrowUpRight size={15} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
            </div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{card.title}</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-0.5 tracking-tight">
              {loading ? <Loader2 className="animate-spin my-1 text-indigo-400" size={24} /> : card.value}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">{card.subtitle}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                <TrendingUp size={16} />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Registration Velocity</h2>
                <p className="text-[11px] text-slate-500">Last 14 days across all programs</p>
              </div>
            </div>
            <Link to="/admin/analytics" className="text-[11px] font-semibold text-indigo-600 hover:underline">
              Full analytics
            </Link>
          </div>
          <div className="h-60">
            {velocity.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <TrendingUp size={26} className="mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No registrations recorded yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={velocity} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminVelocity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }} />
                  <Area type="monotone" dataKey="registrations" stroke="#4F46E5" strokeWidth={2.5} fill="url(#adminVelocity)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
            <span className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600 border border-cyan-100">
              <Sparkles size={16} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Quick Actions</h2>
              <p className="text-[11px] text-slate-500">Common faculty workflows</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Publish a hackathon', to: '/admin/hackathons', icon: Trophy },
              { label: 'Review registrations', to: '/admin/registrations?status=pending', icon: ClipboardList, badge: stats.pendingApprovals },
              { label: 'Post an announcement', to: '/admin/announcements', icon: Megaphone },
              { label: 'Browse student directory', to: '/admin/users', icon: Users },
            ].map(action => (
              <Link
                key={action.label}
                to={action.to}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors group"
              >
                <span className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 group-hover:text-indigo-700">
                  <action.icon size={15} className="text-slate-400 group-hover:text-indigo-600" />
                  {action.label}
                </span>
                {action.badge > 0 ? (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                    {action.badge}
                  </span>
                ) : (
                  <ArrowUpRight size={13} className="text-slate-300 group-hover:text-indigo-600" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-1.5 rounded-lg bg-violet-50 text-violet-600 border border-violet-100">
              <Building2 size={16} />
            </span>
            <h2 className="text-sm font-bold text-slate-900">Participation by Department</h2>
          </div>
          <div className="h-52">
            {departments.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No participation data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departments} layout="vertical" margin={{ top: 0, right: 8, left: 4, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="department" type="category" width={90} fontSize={10} tickLine={false} axisLine={false} stroke="#64748b" />
                  <RechartsTooltip contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="count" fill="#7C3AED" radius={[0, 6, 6, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Activity size={16} />
            </span>
            <h2 className="text-sm font-bold text-slate-900">Recent Activity</h2>
          </div>
          {activity.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">No administrative activity recorded yet</div>
          ) : (
            <div className="space-y-3">
              {activity.slice(0, 5).map(item => (
                <div key={item.id} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-700 leading-snug">
                      <span className="font-semibold">{item.actor_email?.split('@')[0] || 'Faculty'}</span>
                      {' '}{item.action} <span className="font-medium">{item.entity_type}</span>
                      {item.detail ? ` · ${item.detail}` : ''}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{relativeTime(item.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                <CheckCircle2 size={16} />
              </span>
              <h2 className="text-sm font-bold text-slate-900">Capacity Gauges</h2>
            </div>
            <Link to="/admin/events" className="text-[11px] font-semibold text-indigo-600 hover:underline">Manage</Link>
          </div>
          {capacities.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">No programs created yet</div>
          ) : (
            <div className="space-y-3.5">
              {capacities.map(event => {
                const percent = Math.min(100, Math.round(((event.registered || 0) / (event.capacity || 1)) * 100))
                return (
                  <div key={event.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold text-slate-700 truncate">{event.title}</p>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">{event.registered}/{event.capacity}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-1.5 rounded-full bg-indigo-600" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
