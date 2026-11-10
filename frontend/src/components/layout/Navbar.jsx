import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Sparkles, LogIn, ShieldCheck, GraduationCap, Menu, X } from 'lucide-react'

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const isLanding = location.pathname === '/' || location.pathname === '/landing'

  const navLinks = [
    { name: 'Home', href: isLanding ? '#home' : '/#home' },
    { name: 'About Web App', href: isLanding ? '#problem' : '/#problem' },
    { name: 'Get in Touch', href: isLanding ? '#contact' : '/#contact' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Project Logo / Brand Icon with Title */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative flex items-center justify-center">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-100 transition-all">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
              CampusConnect
            </span>
          </div>
        </Link>

        {/* Center: Navigation Links Anchors */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-xs font-semibold tracking-tight text-slate-600 hover:text-slate-900 transition-colors"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Right Side: Dual Portal CTA Buttons */}
        <div className="hidden md:flex items-center gap-2.5">
          <Link
            to="/admin/login"
            className="inline-flex items-center justify-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-all shadow-sm active:scale-95"
          >
            <ShieldCheck size={14} className="text-slate-500" />
            <span>Faculty Login</span>
          </Link>

          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-sm shadow-indigo-500/10 active:scale-95"
          >
            <GraduationCap size={14} />
            <span>Student Portal</span>
          </Link>
        </div>

        {/* Mobile Hamburger Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white/95 backdrop-blur-2xl px-4 py-5 space-y-4 animate-fade-in shadow-lg">
          <nav aria-label="Mobile Navigation" className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors py-1"
              >
                {link.name}
              </a>
            ))}
          </nav>
          
          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            <Link
              to="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-lg shadow-sm shadow-indigo-500/10 transition-all"
            >
              <GraduationCap size={16} />
              <span>Enter Student Portal</span>
            </Link>

            <Link
              to="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold py-2.5 rounded-lg shadow-sm transition-all"
            >
              <ShieldCheck size={16} />
              <span>Faculty & Admin Login</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
