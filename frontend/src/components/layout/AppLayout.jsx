import { Outlet, Link, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { Toaster } from 'react-hot-toast'
import { Sparkles } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export const AppLayout = () => {
  const location = useLocation()
  const { user, profile } = useAuth()
  const studentName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Student'
  const studentInitial = studentName.charAt(0).toUpperCase()

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return 'Dashboard'
      case '/events': return 'Events & Hackathons'
      case '/hackathons': return 'Hackathons'
      case '/team-finder': return 'Team Finder'
      case '/matches': return 'Teammate Matches'
      case '/my-registrations': return 'My Registrations'
      case '/notifications': return 'Notifications'
      case '/networking': return 'Student Networking'
      case '/profile': return 'Student Profile'
      default:
        if (location.pathname.startsWith('/chat/')) return 'Teammate Collaboration'
        return 'Campus Portal'
    }
  }

  return (
    <div className="flex h-screen bg-neutral-50 text-slate-900 overflow-hidden relative selection:bg-indigo-500/20 selection:text-indigo-900 antialiased font-sans">
      
      {/* Floating Navigation Sidebar (Desktop) */}
      <div className="hidden md:flex flex-col my-4 ml-4 z-20 shrink-0">
        <Sidebar />
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto pb-20 md:pb-6 z-10 flex flex-col">
        {/* Sticky Portal Topbar */}
        <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm px-4 md:px-8 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Brand Logo */}
            <Link to="/dashboard" className="md:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shadow-sm">
                <Sparkles size={16} />
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-900">CampusConnect</span>
            </Link>

            {/* Desktop Page Title & Breadcrumb */}
            <div className="hidden md:flex items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-500">Student Portal</span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                {getPageTitle()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Network Indicator */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Fall 2026 Live</span>
            </div>

            {/* User Profile Pill */}
            <Link 
              to="/profile" 
              className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-neutral-50 hover:bg-neutral-100 border border-slate-200 transition-all duration-200 hover:shadow-md shadow-sm"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {studentInitial}
              </div>
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline">{studentName}</span>
            </Link>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 min-h-full flex-1 w-full">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Modern Toast notifications in Light Theme */}
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'bg-white text-slate-900 text-sm border border-slate-200 shadow-xl rounded-2xl',
          style: {
            background: '#ffffff',
            color: '#0f172a',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '12px 18px',
            boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.08)'
          },
        }} 
      />
    </div>
  )
}
