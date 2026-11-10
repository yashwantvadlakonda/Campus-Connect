import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Trophy, CalendarDays, ClipboardList, Megaphone,
  Users, BarChart3, ShieldCheck, ScrollText, GraduationCap,
  ChevronsLeft, ChevronsRight, ArrowUpRight,
} from 'lucide-react'
import { getCachedAdmin } from '../../services/adminApi'

const SECTIONS = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Programs',
    items: [
      { name: 'Hackathons', path: '/admin/hackathons', icon: Trophy },
      { name: 'Events', path: '/admin/events', icon: CalendarDays },
      { name: 'Registrations', path: '/admin/registrations', icon: ClipboardList },
      { name: 'Announcements', path: '/admin/announcements', icon: Megaphone },
    ],
  },
  {
    label: 'Community',
    items: [
      { name: 'Students', path: '/admin/users', icon: Users },
      { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
      { name: 'Faculty & Admins', path: '/admin/faculty', icon: ShieldCheck, adminOnly: true },
      { name: 'Activity Log', path: '/admin/activity', icon: ScrollText },
    ],
  },
]

export const AdminSidebar = ({ collapsed, onToggle, inDrawer = false }) => {
  const admin = getCachedAdmin()
  const role = admin?.role === 'admin' ? 'Administrator' : 'Faculty'

  return (
    <aside className={`${inDrawer ? 'flex h-full w-full' : 'hidden lg:flex sticky top-0 h-screen'} flex-col shrink-0 bg-white border-r border-slate-200 transition-[width] duration-200 ${collapsed ? 'w-[78px]' : 'w-64'}`}>
      <div className={`h-16 flex items-center border-b border-slate-100 ${collapsed ? 'justify-center px-2' : 'justify-between px-5'}`}>
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <GraduationCap size={19} />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-sm font-extrabold text-slate-900 tracking-tight">CampusConnect</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Faculty Console</p>
            </div>
          )}
        </div>
        {!collapsed && !inDrawer && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Collapse sidebar"
          >
            <ChevronsLeft size={16} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-5">
        {SECTIONS.map(section => {
          const items = section.items.filter(item => !item.adminOnly || admin?.role === 'admin')
          if (!items.length) return null
          return (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
                  {section.label}
                </p>
              )}
              <div className="space-y-1">
                {items.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.name : undefined}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-xl text-sm font-medium transition-all ${
                        collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
                      } ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                      }`
                    }
                  >
                    <item.icon size={18} className="shrink-0" />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      <div className="border-t border-slate-100 p-3 space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
              {(admin?.full_name || admin?.email || 'FA').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-800 truncate">{admin?.full_name || 'Faculty'}</p>
              <p className="text-[10px] text-slate-500 truncate">{role}</p>
            </div>
          </div>
        )}
        <NavLink
          to="/dashboard"
          className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors ${collapsed ? 'justify-center' : ''}`}
          title="Open student portal"
        >
          <ArrowUpRight size={15} />
          {!collapsed && <span>Student View</span>}
        </NavLink>
        {collapsed && !inDrawer && (
          <button
            onClick={onToggle}
            className="flex items-center justify-center w-full px-2.5 py-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Expand sidebar"
          >
            <ChevronsRight size={16} />
          </button>
        )}
      </div>
    </aside>
  )
}

export default AdminSidebar
