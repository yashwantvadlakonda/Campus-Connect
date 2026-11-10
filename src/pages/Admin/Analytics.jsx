import { useState, useEffect } from 'react'
import { getAdminAnalytics } from '../../services/adminApi'
import { Loader2, TrendingUp, BarChart3, Users, Zap, Award, Layers } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts'

export default function AdminAnalytics() {
  const [data, setData] = useState({
    registrationsOverTime: [],
    popularSkills: []
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const response = await getAdminAnalytics()
        if (response && (response.registrationsOverTime || response.popularSkills)) {
          // The API returns {date, registrations}; the charts below expect {name, count}
          const timeline = (response.registrationsOverTime || []).map(point => ({
            name: point.name ?? point.date,
            count: point.count ?? point.registrations ?? 0
          }))
          setData({
            registrationsOverTime: timeline,
            popularSkills: response.popularSkills || []
          })
        }
      } catch (error) {
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[75vh] items-center justify-center flex-col gap-3">
        <Loader2 className="animate-spin text-purple-500 w-10 h-10" />
        <p className="text-sm text-slate-400">Loading analytics & metrics...</p>
      </div>
    )
  }

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4']
  const topSkillName = data.popularSkills[0]?.skill || data.popularSkills[0]?.name || 'Pending Data'
  const topSkillCount = data.popularSkills[0]?.count || 0

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold uppercase tracking-wider mb-2">
          <BarChart3 size={14} />
          Telemetry & Intelligence
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Campus Analytics & Trends</h1>
        <p className="text-slate-500 text-xs mt-1">Deep longitudinal data into student skill distribution and event signup velocity.</p>
      </div>

      {/* KPI highlight pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
            <Zap size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Growth Velocity</p>
            <h4 className="text-xl font-bold text-slate-900 mt-0.5">
              {data.registrationsOverTime.length > 0 ? 'Active' : 'Awaiting Data'}
            </h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
            <Award size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Top Indexed Skill</p>
            <h4 className="text-xl font-bold text-slate-900 mt-0.5">
              {topSkillName} {topSkillCount > 0 ? `(${topSkillCount})` : ''}
            </h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Active Teaming Rate</p>
            <h4 className="text-xl font-bold text-slate-900 mt-0.5">Live Database</h4>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registrations Over Time */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                <TrendingUp size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Cumulative Registrations</h2>
                <p className="text-xs text-slate-500">Total event RSVPs over semester weeks</p>
              </div>
            </div>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {data.registrationsOverTime.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">No Registration History Recorded</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  Event RSVP velocity metrics will graph dynamically as students register for events.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.registrationsOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      borderColor: '#e2e8f0', 
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#0f172a',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)'
                    }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#4f46e5" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} name="Total RSVPs" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Most Popular Skills */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-100">
                <Layers size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Most In-Demand Skills</h2>
                <p className="text-xs text-slate-500">Ranked by student profile declarations</p>
              </div>
            </div>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {data.popularSkills.length === 0 ? (
              <div className="text-center py-8">
                <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">No Skill Declarations Yet</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  Skills declared on student profiles and required in published events will index here.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={data.popularSkills} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis dataKey="skill" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={110} />
                  <RechartsTooltip 
                    cursor={{fill: 'rgba(241, 245, 249, 0.6)'}}
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      borderColor: '#e2e8f0', 
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#0f172a',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)'
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Students">
                    {data.popularSkills.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
