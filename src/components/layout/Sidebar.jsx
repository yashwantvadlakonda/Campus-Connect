import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Calendar, Users, MessageCircle, User, LogOut, Sparkles, Trophy, Ticket, Bell, Network } from 'lucide-react'
import { signOut } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { motion } from 'framer-motion'

export const Sidebar = () => {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Events Deck', path: '/events', icon: Calendar },
    { name: 'Hackathons', path: '/hackathons', icon: Trophy },
    { name: 'Team Finder', path: '/team-finder', icon: Users, badge: 'Hot' },
    { name: 'Matches', path: '/matches', icon: MessageCircle },
    { name: 'My Registrations', path: '/my-registrations', icon: Ticket },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Networking', path: '/networking', icon: Network },
    { name: 'My Profile', path: '/profile', icon: User },
  ]

  const handleLogout = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  const studentName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Student'
  const studentInitial = studentName.charAt(0).toUpperCase()

  return (
    <aside className="w-64 h-[calc(100vh-2rem)] bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl flex flex-col justify-between shadow-xl shadow-indigo-500/5 overflow-hidden sticky top-4">
      {/* Top: Brand Header */}
      <div>
        <div className="p-5 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shadow-sm">
                <Sparkles size={18} />
              </div>
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                CampusConnect
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">
                Student Network
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'text-indigo-700 bg-indigo-50/80 border border-indigo-200/80 shadow-sm font-semibold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:shadow-md'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <item.icon 
                      size={18} 
                      className={`transition-colors ${
                        isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`} 
                    />
                    <span>{item.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-sm">
                        {item.badge}
                      </span>
                    )}
                    {item.count && !isActive && (
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {item.count}
                      </span>
                    )}
                  </div>

                  {/* Active Indicator Pill */}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavPill"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-600 rounded-r-full"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom: User profile badge & clean logout */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center justify-between p-2 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar with live emerald online dot */}
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {studentInitial}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{studentName}</p>
              <p className="text-[10px] text-slate-500 truncate">{profile?.major || profile?.branch || 'Student profile'}</p>
            </div>
          </div>

          {/* Clean Logout Icon */}
          <button 
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
