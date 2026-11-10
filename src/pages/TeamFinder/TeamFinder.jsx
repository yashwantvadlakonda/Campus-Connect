import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSuggestedTeammates, subscribeDirectory, swipeTeammate } from '../../services/api'
import { toast } from 'react-hot-toast'
import { 
  Users, X, Heart, Loader2, Code, Briefcase, GraduationCap, 
  Sparkles, CheckCircle2, RotateCcw, ArrowRight, ShieldCheck
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function TeamFinder() {
  const [teammates, setTeammates] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [matchedPerson, setMatchedPerson] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    const fetchTeammates = async (forceRefresh = false) => {
      try {
        const data = await getSuggestedTeammates(forceRefresh)
        if (active) setTeammates(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('API Error:', error)
        if (active) setTeammates([])
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchTeammates()
    const unsubscribe = subscribeDirectory(() => fetchTeammates(true))
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const handleSwipe = async (direction, targetUser) => {
    const isInterested = direction === 'right'
    try {
      await swipeTeammate(targetUser.id, isInterested).catch(() => {})
      
      if (isInterested) {
        // Trigger celebration match for demo
        if (Math.random() > 0.35) {
          setMatchedPerson(targetUser)
        } else {
          toast.success(`Liked ${targetUser.name}!`, { icon: '👍' })
        }
      } else {
        toast('Passed', { icon: '⏭️' })
      }
    } catch (error) {
      console.error(error)
    }
    
    setCurrentIndex(prev => prev + 1)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (currentIndex >= teammates.length || matchedPerson) return
      const current = teammates[currentIndex]
      if (e.key === 'ArrowRight') {
        handleSwipe('right', current)
      } else if (e.key === 'ArrowLeft') {
        handleSwipe('left', current)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, teammates, matchedPerson])

  if (loading) {
    return (
      <div className="flex h-[75vh] items-center justify-center flex-col gap-3">
        <Loader2 className="animate-spin text-rose-500 w-10 h-10" />
        <p className="text-sm text-slate-400">Curating top teammate suggestions...</p>
      </div>
    )
  }

  if (teammates.length === 0) {
    return (
      <div className="flex flex-col h-[75vh] items-center justify-center text-center animate-fade-in max-w-md mx-auto p-6">
        <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6 shadow-sm">
          <Users className="text-indigo-600 w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No Teammate Suggestions Yet</h2>
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          As students join CampusConnect and complete their profiles with skills and interests, matching candidates will appear here for swipe discovery.
        </p>
        <button 
          onClick={() => navigate('/profile')} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 py-3 px-6 text-sm shadow-sm shadow-indigo-500/10"
        >
          <span>Update My Profile Skills</span>
          <ArrowRight size={16} />
        </button>
      </div>
    )
  }

  if (currentIndex >= teammates.length) {
    return (
      <div className="flex flex-col h-[75vh] items-center justify-center text-center animate-fade-in max-w-md mx-auto p-6">
        <div className="w-20 h-20 rounded-3xl bg-white border border-slate-200 flex items-center justify-center mb-6 shadow-sm">
          <Users className="text-indigo-600 w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">You're All Caught Up! 🎉</h2>
        <p className="text-slate-600 text-sm mb-8 leading-relaxed">
          You have reviewed all available student profiles for this cycle. Check your active matches to begin planning!
        </p>
        <div className="flex gap-3 w-full">
          <button 
            onClick={() => setCurrentIndex(0)} 
            className="flex-1 btn-secondary flex items-center justify-center gap-2 py-3 text-sm"
          >
            <RotateCcw size={16} />
            <span>Review Again</span>
          </button>
          <button 
            onClick={() => navigate('/matches')} 
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 py-3 text-sm shadow-sm shadow-indigo-500/10"
          >
            <span>My Matches</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  const currentPerson = teammates[currentIndex]

  return (
    <div className="h-[84vh] flex flex-col items-center max-w-md mx-auto w-full relative">
      {/* Title & Key hints */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles size={13} className="text-indigo-600" />
          Teammate Discovery Deck
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Find Your Next Co-Founder</h1>
        <p className="text-slate-500 text-xs mt-1">
          Use buttons or <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 border border-slate-200 font-mono">←</kbd> Pass / <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 border border-slate-200 font-mono">→</kbd> Team Up
        </p>
      </div>

      {/* Swipe Card Deck */}
      <div className="flex-1 w-full relative">
        <AnimatePresence>
          <motion.div
            key={currentPerson.id}
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(e, { offset }) => {
              if (offset.x > 90) {
                handleSwipe('right', currentPerson)
              } else if (offset.x < -90) {
                handleSwipe('left', currentPerson)
              }
            }}
            className="absolute inset-0 bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col cursor-grab active:cursor-grabbing border border-slate-200"
          >
            {/* Header banner with match score */}
            <div className={`h-28 bg-gradient-to-r ${currentPerson.avatarGradient} relative flex items-center justify-between p-4`}>
              <div className="bg-white/90 backdrop-blur-md text-slate-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm border border-slate-200">
                <Sparkles size={12} className="text-amber-500" />
                <span>{currentPerson.matchScore} Compatibility</span>
              </div>
              {currentPerson.hackathonsWon > 0 && (
                <div className="bg-white/90 backdrop-blur-md text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm border border-slate-200">
                  <span>🏆 {currentPerson.hackathonsWon} Win{currentPerson.hackathonsWon > 1 ? 's' : ''}</span>
                </div>
              )}

              {/* Floating Avatar */}
              <div className="w-20 h-20 bg-indigo-50 border-4 border-white rounded-2xl flex items-center justify-center text-indigo-700 text-2xl font-bold absolute -bottom-10 left-6 shadow-md border-slate-200">
                {currentPerson.name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
            
            {/* Content Body */}
            <div className="px-6 pt-12 pb-6 flex-1 flex flex-col overflow-y-auto space-y-4 bg-white">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{currentPerson.name}</h2>
                  <ShieldCheck size={18} className="text-indigo-600" title="Verified Campus Student" />
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                  <GraduationCap size={15} className="text-indigo-600" />
                  <span className="font-medium text-slate-700">{currentPerson.major} • {currentPerson.year}</span>
                </div>
              </div>

              {/* Bio Quote */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed italic">
                "{currentPerson.bio}"
              </div>

              {/* Skills Section */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 text-indigo-700">
                  <Code size={14} className="text-indigo-600" /> Technical Stack & Skills
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {currentPerson.skills.map(skill => (
                    <span key={skill} className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-2.5 py-1 rounded-lg font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Interests Section */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 text-purple-700">
                  <Briefcase size={14} className="text-purple-600" /> Hackathon Interests & Goals
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {currentPerson.interests.map(interest => (
                    <span key={interest} className="bg-purple-50 text-purple-700 border border-purple-200 text-xs px-2.5 py-1 rounded-lg font-medium">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Swipe Action Controls */}
      <div className="flex items-center justify-center gap-8 mt-5 z-10 py-1">
        <button 
          onClick={() => handleSwipe('left', currentPerson)}
          className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-md active:scale-90"
          title="Pass (Left Arrow)"
        >
          <X size={26} />
        </button>
        
        <button 
          onClick={() => handleSwipe('right', currentPerson)}
          className="w-16 h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center text-white transition-all shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95"
          title="Team Up (Right Arrow)"
        >
          <Heart size={30} className="fill-white" />
        </button>
      </div>

      {/* Mutual Match Celebration Modal */}
      <AnimatePresence>
        {matchedPerson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-white max-w-sm w-full p-6 sm:p-8 rounded-3xl border border-slate-200 text-center shadow-2xl relative max-h-[90vh] flex flex-col overflow-y-auto mx-auto"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 mx-auto flex items-center justify-center text-white text-3xl shadow-md mb-4 animate-bounce">
                🎉
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">It's a Match!</h2>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                You and <strong className="text-indigo-600">{matchedPerson.name}</strong> both expressed interest in collaborating!
              </p>

              <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1">
                <p className="text-slate-600"><strong className="text-slate-900">Major:</strong> {matchedPerson.major}</p>
                <p className="text-slate-600"><strong className="text-slate-900">Shared Skills:</strong> {(matchedPerson.skills || []).slice(0, 3).join(', ')}</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/matches')}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2 shadow-sm shadow-indigo-500/10 transition-all"
                >
                  <Sparkles size={16} />
                  <span>Open Teammate Chat</span>
                </button>
                <button
                  onClick={() => setMatchedPerson(null)}
                  className="w-full btn-secondary py-2.5 text-xs"
                >
                  Keep Swiping
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
