import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMatches, getMyRegistrations, getMyTeam, inviteTeamMember } from '../../services/api'
import { toast } from 'react-hot-toast'
import { MessageCircle, Loader2, Users, Sparkles, ChevronRight, Search, UserPlus } from 'lucide-react'

export default function Matches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [squads, setSquads] = useState([])
  const [inviteMenuMatchId, setInviteMenuMatchId] = useState(null)

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await getMatches()
        setMatches(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('API Error:', error)
        setMatches([])
      } finally {
        setLoading(false)
      }
    }
    fetchMatches()

    getMyRegistrations().then((regs) => {
      if (!Array.isArray(regs)) return
      Promise.all(regs.map((reg) =>
        getMyTeam(reg.event_id)
          .then((team) => (team ? { event_id: reg.event_id, event_title: reg.event_title, team } : null))
          .catch(() => null)
      )).then((results) => setSquads(results.filter(Boolean)))
    }).catch(() => {})
  }, [])

  const filteredMatches = matches.filter(m => 
    !search || 
    m.user?.name?.toLowerCase().includes(search.toLowerCase()) || 
    m.user?.major?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex h-[75vh] items-center justify-center flex-col gap-3">
        <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
        <p className="text-sm text-slate-400">Loading your matches...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-1.5">
            <Sparkles size={13} className="text-indigo-600" />
            Mutual Connections
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Team Matches</h1>
          <p className="text-slate-500 text-xs mt-1">Students who also swiped right to team up with you</p>
        </div>
        
        <Link 
          to="/team-finder"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-sm shadow-indigo-500/10 transition-all"
        >
          <Users size={14} />
          <span>Find More Teammates</span>
        </Link>
      </div>

      {/* Search Filter */}
      {matches.length > 0 && (
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search connections by student or major..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Matches List */}
      {filteredMatches.length === 0 ? (
        <div className="bg-white text-center py-16 px-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-sm">
            <MessageCircle size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Matches Found</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto mb-6">
            Swipe right on potential teammates in the Team Finder to create mutual connections.
          </p>
          <Link to="/team-finder" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-6 rounded-xl inline-flex items-center gap-2 shadow-sm shadow-indigo-500/10">
            <span>Explore Teammates</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map((match) => (
            <Link 
              key={match.id} 
              to={`/chat/${match.id}`}
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex items-center gap-4 group hover:-translate-y-0.5 shadow-sm"
            >
              {/* Avatar with status */}
              <div className="relative shrink-0">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${match.user.avatarGradient || 'from-indigo-600 to-blue-600'} flex items-center justify-center text-white text-base font-bold shadow-sm`}>
                  {match.user.name?.split(' ').map(n => n[0]).join('')}
                </div>
                {match.online && (
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" title="Online" />
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-slate-900 text-base truncate group-hover:text-indigo-600 transition-colors pr-2">
                    {match.user.name}
                  </h3>
                  <span className="text-[11px] text-slate-400 shrink-0 font-medium">{match.lastMessageTime}</span>
                </div>
                
                <p className="text-xs text-slate-600 truncate pr-4">
                  {match.lastMessage || 'Connected! Say hi to kick off your team.'}
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {match.user.major}
                  </span>
                  {match.user.skills && match.user.skills.length > 0 && (
                    <div className="flex gap-1 overflow-hidden">
                      {match.user.skills.slice(0, 2).map(sk => (
                        <span key={sk} className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Unread Pill or Chevron */}
              <div className="shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {squads.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setInviteMenuMatchId((prev) => (prev === match.id ? null : match.id))
                      }}
                      className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                    >
                      <UserPlus size={12} />
                      Invite to Squad
                    </button>
                    {inviteMenuMatchId === match.id && (
                      <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                          Your registered squads
                        </div>
                        {squads.map((squad) => (
                          <button
                            key={squad.team.id}
                            onClick={async (e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              try {
                                await inviteTeamMember(squad.team.id, match.user.id)
                                toast.success(`Invitation sent to ${match.user.name}`)
                              } catch (error) {
                                toast.error('Unable to send squad invitation.')
                              }
                              setInviteMenuMatchId(null)
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 transition-colors"
                          >
                            <div className="font-semibold text-slate-900 truncate">{squad.team.name}</div>
                            <div className="text-[10px] text-slate-500 truncate">{squad.event_title}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {match.unread > 0 ? (
                  <span className="bg-indigo-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm shadow-indigo-600/30">
                    {match.unread}
                  </span>
                ) : (
                  <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
