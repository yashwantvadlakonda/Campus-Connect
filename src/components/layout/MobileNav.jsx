import { NavLink } from 'react-router-dom'
import { Home, Calendar, Users, MessageCircle, User } from 'lucide-react'

export const MobileNav = () => {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Finder', path: '/team-finder', icon: Users },
    { name: 'Matches', path: '/matches', icon: MessageCircle },
    { name: 'Profile', path: '/profile', icon: User },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 z-50 px-2 py-1 shadow-lg">
      <div className="flex justify-around items-center">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 hover:bg-slate-50 ${
                isActive 
                  ? 'text-indigo-600 font-semibold scale-105' 
                  : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1 rounded-lg ${isActive ? 'bg-indigo-50 text-indigo-600' : ''}`}>
                  <item.icon size={20} />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.name}</span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-indigo-600 mt-0.5"></span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
