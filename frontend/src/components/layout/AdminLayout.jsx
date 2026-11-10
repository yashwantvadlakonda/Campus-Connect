import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Toaster, toast } from 'react-hot-toast'
import { Menu, LogOut, ShieldCheck, X } from 'lucide-react'
import { adminSignOut, getCachedAdmin } from '../../services/adminApi'
import { AdminSidebar } from './AdminSidebar'

const SECTION_TITLES = {
  '/admin/dashboard': 'Dashboard Overview',
  '/admin/hackathons': 'Hackathon Management',
  '/admin/events': 'Campus Events',
  '/admin/registrations': 'Registration Management',
  '/admin/announcements': 'Announcements',
  '/admin/users': 'Student Directory',
  '/admin/analytics': 'Analytics & Reports',
  '/admin/faculty': 'Faculty & Admin Management',
  '/admin/activity': 'Activity Log',
}

export const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const admin = getCachedAdmin()

  const handleSignOut = async () => {
    await adminSignOut()
    toast.success('Signed out of the Faculty Console')
    navigate('/admin/login', { replace: true })
  }

  const title = SECTION_TITLES[location.pathname] || 'Faculty Console'

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex font-sans antialiased">
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(value => !value)} />

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-72 max-w-[85vw] bg-white shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 z-10 p-2 rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
            <AdminSidebar collapsed={false} onToggle={() => {}} inDrawer />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">{title}</h1>
              <p className="hidden sm:block text-[11px] text-slate-500">
                Faculty &amp; Administrator Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 pl-2.5 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-full">
              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                {(admin?.full_name || admin?.email || 'FA').slice(0, 2).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-slate-700 truncate max-w-[170px]">
                {admin?.email || 'faculty@university.edu'}
              </span>
              <span className="bg-violet-50 text-violet-700 border border-violet-200 font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">
                {admin?.role || 'faculty'}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl border border-rose-200 transition-all active:scale-95"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <Outlet />
        </main>

        <footer className="py-5 border-t border-slate-200 text-center text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-indigo-500" />
            CampusConnect Faculty Portal · Role-based access · Live database
          </span>
        </footer>
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#172033',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '12px 16px',
            fontSize: '13px',
            boxShadow: '0 12px 30px -12px rgba(15, 23, 42, 0.18)',
          },
        }}
      />
    </div>
  )
}

export default AdminLayout
