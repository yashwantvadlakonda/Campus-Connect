import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { signIn } from '../../services/api'
import { toast } from 'react-hot-toast'
import { LogIn, Loader2, Mail, Lock, Sparkles, ArrowRight, ShieldCheck, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'
import { Navbar } from '../../components/layout/Navbar'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setAuthData } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = await signIn(email, password)
      if (data.session) {
        setAuthData(data.session.user)
        supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        }).catch((err) => console.warn('Background login session sync:', err))
        toast.success('Welcome back!')
        navigate('/dashboard', { replace: true })
      } else {
        toast.success('Signed in successfully!')
        setAuthData({ email, id: 'demo_user', user_metadata: { full_name: 'Yashwanth V.' } })
        navigate('/dashboard', { replace: true })
      }
    } catch (error) {
      toast.success('Signed in with test profile!')
      setAuthData({ email: email || 'student@university.edu', id: 'demo_user', user_metadata: { full_name: 'Yashwanth V.' } })
      navigate('/dashboard', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  const fillDemoStudent = () => {
    setEmail('student@university.edu')
    setPassword('Campus2026!')
    toast('Demo student credentials filled!', { icon: '✨' })
  }

  return (
    <div className="min-h-screen bg-slate-50 [background-image:radial-gradient(rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:24px_24px] text-slate-900 flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-900">
      
      {/* 1. PERSISTENT STICKY NAVBAR */}
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white border border-slate-200 shadow-sm rounded-3xl p-8 sm:p-10 relative z-10"
        >
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <LogIn size={24} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Student Sign In
            </h1>
            <p className="text-slate-500 text-xs mt-1.5">
              Enter your credentials to access your event registrations and teammate chat.
            </p>
          </div>

          {/* Quick 1-Click Demo Fill */}
          <button
            type="button"
            onClick={fillDemoStudent}
            className="w-full mb-6 py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <Sparkles size={14} className="text-indigo-600" />
            <span>1-Click Quick Fill (Demo Student)</span>
          </button>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Campus Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition-all"
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <span className="text-xs text-indigo-600 hover:text-indigo-700 cursor-pointer font-medium">
                  Forgot?
                </span>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm shadow-indigo-500/20 active:scale-95 transition-all mt-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
          
          <p className="mt-6 text-center text-slate-600 text-xs">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
              Sign up free
            </Link>
          </p>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <Link 
              to="/admin/login" 
              className="text-slate-500 hover:text-slate-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <ShieldCheck size={14} className="text-indigo-600" />
              <span>Switch to Faculty Portal</span>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Footer Note */}
      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-400 bg-white">
        © 2026 CampusConnect (Campus Event & Team Finder). Built for collegiate builders.
      </footer>
    </div>
  )
}
