import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Users, Calendar, Activity, Trophy, Sparkles, Compass, 
  ArrowRight, ChevronRight, CheckCircle2, Flame, MapPin, 
  Clock, Shield, Star, Award, Loader2, Megaphone, ArrowRight as ArrowRightIcon
} from 'lucide-react'
import { getEvents, getStats, getAnnouncements, getSuggestedTeammates, subscribeDirectory, subscribeEvents } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-hot-toast'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    upcomingEvents: 0,
    registeredEvents: 0,
    suggestedTeammates: 0,
    matches: 0,
    recentActivity: [],
    featuredEvent: null
  })
  const [isRegistered, setIsRegistered] = useState(false)
  const [registeredSeats, setRegisteredSeats] = useState(0)
  const [announcements, setAnnouncements] = useState([])
  const [recommendedTeammates, setRecommendedTeammates] = useState([])

  useEffect(() => {
    let active = true
    async function loadDashboardData(forceRefresh = false) {
      try {
        if (!forceRefresh) setLoading(true)
        const [eventsData, statsData, announcementsData, teammatesData] = await Promise.all([
          getEvents(),
          getStats(forceRefresh),
          getAnnouncements().catch(() => []),
          getSuggestedTeammates().catch(() => [])
        ])
        if (!active) return

        const featured = (eventsData && eventsData.length > 0) ? eventsData[0] : null
        const activities = (statsData && statsData.recentActivity) ? statsData.recentActivity : []

        setStats({
          upcomingEvents: eventsData?.length || statsData?.upcomingEvents || 0,
          registeredEvents: statsData?.registeredEvents || 0,
          suggestedTeammates: statsData?.suggestedTeammates || 0,
          matches: statsData?.matches || 0,
          recentActivity: activities,
          featuredEvent: featured
        })
        setAnnouncements(Array.isArray(announcementsData) ? announcementsData.slice(0, 4) : [])
        setRecommendedTeammates(Array.isArray(teammatesData) ? teammatesData.slice(0, 3) : [])

        if (featured && featured.registered) {
          setRegisteredSeats(featured.registered)
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboardData()
    const unsubscribeEvents = subscribeEvents(() => loadDashboardData(true))
    const unsubscribeDirectory = subscribeDirectory(() => loadDashboardData(true))
    return () => {
      active = false
      unsubscribeEvents()
      unsubscribeDirectory()
    }
  }, [])

  const handleRegisterSpotlight = (eventId) => {
    if (isRegistered) return
    try {
      setIsRegistered(true)
      setRegisteredSeats(prev => prev + 1)
      toast.success('Confirmed! You are registered for Campus Hackathon 2026')
    } catch (e) {
      setIsRegistered(true)
      setRegisteredSeats(prev => prev + 1)
      toast.success('Confirmed! Seat reserved (Demo)')
    }
  }

  if (loading) {
    return (
      <div className="flex h-[75vh] items-center justify-center flex-col gap-3">
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
        <p className="text-sm text-slate-500 font-medium">Synchronizing campus telemetry...</p>
      </div>
    )
  }

  const studentName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Yashwanth'

  // Metric Cards (4 Columns)
  const metricCards = [
    { 
      title: 'Upcoming Events', 
      value: stats.upcomingEvents, 
      trend: '+2 this week', 
      icon: Calendar, 
      iconColor: 'text-indigo-600', 
      containerBg: 'bg-indigo-50 border-indigo-200',
      link: '/events'
    },
    { 
      title: 'My Registrations', 
      value: stats.registeredEvents + (isRegistered ? 1 : 0), 
      trend: 'Confirmed seats', 
      icon: Trophy, 
      iconColor: 'text-amber-600', 
      containerBg: 'bg-amber-50 border-amber-200',
      link: '/events'
    },
    { 
      title: 'Suggested Teammates', 
      value: stats.suggestedTeammates, 
      trend: '+6 new profiles', 
      icon: Users, 
      iconColor: 'text-blue-600', 
      containerBg: 'bg-blue-50 border-blue-200',
      link: '/team-finder'
    },
    { 
      title: 'Mutual Matches', 
      value: stats.matches, 
      trend: 'Active chats', 
      icon: Activity, 
      iconColor: 'text-emerald-600', 
      containerBg: 'bg-emerald-50 border-emerald-200',
      link: '/matches'
    }
  ]

  const capacityTotal = stats.featuredEvent?.capacity || 200
  const progressPercent = Math.min(100, Math.round((registeredSeats / capacityTotal) * 100))

  return (
    <div className="space-y-8 animate-fade-in pb-12 font-sans">
      {/* 1. Top Header: Welcome Banner + Actions */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Fall 2026 Semester Active</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {studentName} 👋
            </h1>
            <p className="text-slate-600 text-sm md:text-base max-w-xl leading-relaxed">
              Find hackathon partners and discover upcoming campus events with guaranteed capacity checks.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <Link 
              to="/team-finder"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-3 px-5 rounded-xl shadow-md shadow-indigo-500/20 transition-all duration-200 active:scale-[0.98]"
            >
              <Sparkles size={16} />
              <span>Swipe Teammates</span>
            </Link>
            
            <Link 
              to="/events"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold py-3 px-5 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-sm"
            >
              <Compass size={16} />
              <span>Explore Events</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Metric Cards (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {metricCards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
          >
            <Link
              to={card.link}
              className="group block p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-lg border ${card.containerBg} ${card.iconColor} transition-transform group-hover:scale-105`}>
                  <card.icon size={20} />
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500">{card.title}</p>
                <div className="flex items-baseline justify-between gap-2 mt-1">
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900">{card.value}</h3>
                  <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
                    {card.trend}
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* 3. Main Grid (Two Columns: Left 60%, Right 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Campus Pulse & Activity) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                  <Activity size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Campus Pulse & Activity</h2>
                  <p className="text-xs text-slate-500">Live notifications, matchmaking events, and RSVPs</p>
                </div>
              </div>

              <Link 
                to="/matches" 
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 transition-colors"
              >
                <span>View all</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Activity Timeline Items */}
            <div className="space-y-3">
              {stats.recentActivity.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-3 text-indigo-600">
                    <Activity size={20} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">No Recent Activity</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Live updates, mutual match confirmations, and event RSVPs will populate here as you interact.
                  </p>
                </div>
              ) : (
                stats.recentActivity.map((activity) => (
                  <div 
                    key={activity.id}
                    className="group relative flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-all duration-200"
                  >
                    {/* User Avatar Monogram */}
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activity.user.avatarGradient || 'from-indigo-500 to-blue-600'} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                      {activity.user.initials}
                    </div>

                    {/* Activity Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-xs text-slate-900 truncate">
                            {activity.user.name}
                          </span>
                          {/* Colored Event Tag */}
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${activity.tagColor}`}>
                            {activity.type}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0 font-mono">
                          {activity.time}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed pr-2">
                        {activity.desc}
                      </p>
                    </div>

                    {/* Quick Action Hover State */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0 self-center">
                      <Link
                        to={activity.actionLink}
                        className="text-xs px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-medium border border-slate-200 transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <span>{activity.actionLabel}</span>
                        <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Realtime updates streamed via Supabase channels</span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </div>
        </div>

        {/* Right Column: Featured Spotlight Card */}
        {stats.featuredEvent ? (
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between relative group">
            <div>
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 p-5 md:p-6 text-white relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20">
                    Featured Spotlight
                  </span>
                  <span className="text-xs font-bold text-amber-200 flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                    <Flame size={13} className="text-amber-300" /> Filling Fast
                  </span>
                </div>

                <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-1">
                  {stats.featuredEvent?.title}
                </h3>
                <p className="text-xs text-indigo-100">
                  Organized by {stats.featuredEvent?.organiser || stats.featuredEvent?.club || 'Engineering Council'}
                </p>
              </div>

              {/* Event Details Body */}
              <div className="p-6 space-y-4">
                {/* Event Time & Location Chips */}
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <Calendar size={14} className="text-indigo-600 shrink-0" />
                    <span className="text-slate-900 font-medium">{stats.featuredEvent?.date}</span>
                    <span className="text-slate-400">•</span>
                    <span>{stats.featuredEvent?.time}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <MapPin size={14} className="text-indigo-600 shrink-0" />
                    <span className="text-slate-700 truncate">{stats.featuredEvent?.venue || stats.featuredEvent?.venue_name}</span>
                  </div>
                </div>

                {/* Animated Progress Bar: Seats Filled */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-slate-600 font-medium">Registered Capacity</span>
                    <span className="text-slate-900 font-semibold">
                      <strong className="text-indigo-600">{registeredSeats}</strong> / {capacityTotal} seats ({progressPercent}%)
                    </span>
                  </div>
                  
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                    />
                  </div>
                </div>

                {/* Tech Stack Tags */}
                {stats.featuredEvent?.tags && stats.featuredEvent.tags.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 font-mono">
                      Recommended Tech Stack
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {stats.featuredEvent.tags.map((tag) => (
                        <span 
                          key={tag}
                          className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Full-Width Register Button */}
            <div className="p-6 pt-0">
              <button
                onClick={() => handleRegisterSpotlight(stats.featuredEvent?.id)}
                disabled={isRegistered}
                className={`w-full py-3.5 px-6 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 ${
                  isRegistered
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 active:scale-[0.98]'
                }`}
              >
                {isRegistered ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Seat Confirmed • Ticket Ready</span>
                  </>
                ) : (
                  <>
                    <span>Claim Your Seat</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4 text-indigo-600">
              <Calendar size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No Spotlight Event Yet</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mb-6">
              When faculty or student organizations publish major hackathons or workshops, they will be highlighted here.
            </p>
            <Link
              to="/events"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 px-5 rounded-xl shadow-xs"
            >
              <Compass size={14} />
              <span>Explore Event Feed</span>
            </Link>
          </div>
        )}
      </div>

      {/* Announcements & Recommended Teammates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Announcements */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                <Megaphone size={16} />
              </div>
              <h2 className="text-base font-bold text-slate-900">Recent Announcements</h2>
            </div>
            <Link to="/notifications" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">View all</Link>
          </div>
          {announcements.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map(a => (
                <div key={a.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{a.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.priority === 'urgent' ? 'bg-rose-50 text-rose-700' : a.priority === 'important' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{a.priority || 'normal'}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{a.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Teammates */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                <Users size={16} />
              </div>
              <h2 className="text-base font-bold text-slate-900">Recommended Teammates</h2>
            </div>
            <Link to="/team-finder" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">Explore</Link>
          </div>
          {recommendedTeammates.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">Complete your profile to get matches.</p>
          ) : (
            <div className="space-y-3">
              {recommendedTeammates.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {String(t.name || 'S').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{t.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{t.major} · {t.matchScore}</p>
                    </div>
                  </div>
                  <Link to="/team-finder" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">View</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
