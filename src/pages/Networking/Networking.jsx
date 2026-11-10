import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getStudents } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { Loader2, Users, Search, Mail, Code2, Heart } from 'lucide-react'

export default function Networking() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const data = await getStudents()
        if (active) setStudents(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error(e)
        toast.error('Unable to load student directory.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const filtered = students.filter(s => {
    if (s.id === user?.id) return false
    const q = query.toLowerCase()
    if (!q) return true
    return (
      String(s.full_name || '').toLowerCase().includes(q) ||
      String(s.major || s.branch || '').toLowerCase().includes(q) ||
      (Array.isArray(s.skills) && s.skills.some(k => String(k).toLowerCase().includes(q)))
    )
  })

  if (loading) {
    return (
      <div className="flex h-[75vh] items-center justify-center flex-col gap-3">
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
        <p className="text-sm text-slate-500 font-medium">Loading student network...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Student Networking</h1>
          <p className="text-sm text-slate-500 mt-1">Connect with peers and view public profiles.</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, major, skill..."
            className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <Users size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Students Found</h3>
          <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto">
            Try a different search or check back later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((s, idx) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                  {String(s.full_name || 'S').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{s.full_name}</h3>
                  <p className="text-xs text-slate-500 truncate">{s.major || s.branch || 'Student'}{s.year ? ` · Year ${s.year}` : ''}</p>
                </div>
              </div>
              {s.bio && <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{s.bio}</p>}
              {Array.isArray(s.skills) && s.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {s.skills.slice(0, 6).map(sk => (
                    <span key={sk} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                      <Code2 size={9} /> {sk}
                    </span>
                  ))}
                </div>
              )}
              {Array.isArray(s.interests) && s.interests.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {s.interests.slice(0, 4).map(it => (
                    <span key={it} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-pink-50 text-pink-700 border border-pink-100 flex items-center gap-1">
                      <Heart size={9} /> {it}
                    </span>
                  ))}
                </div>
              )}
              {s.email && (
                <a href={`mailto:${s.email}`} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-auto">
                  <Mail size={12} /> {s.email}
                </a>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
