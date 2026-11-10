import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  X, Sparkles, Users, Tag, Loader2, ArrowRight, 
  AlertCircle, Shield, Copy, Check, Share2, UserPlus 
} from 'lucide-react'
import { createTeam } from '../../../services/api'
import { toast } from 'react-hot-toast'
import RequestMembersModal from './RequestMembersModal'

export default function CreateTeamModal({ event, onClose, onTeamCreated }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [skills, setSkills] = useState(['React', 'FastAPI'])
  const [skillInput, setSkillInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Transition state after team creation
  const [createdTeam, setCreatedTeam] = useState(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)

  const skillPresets = ['React', 'Python', 'FastAPI', 'UI/UX', 'PostgreSQL', 'AI/ML', 'Cloud', 'Mobile']

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = skillInput.trim().replace(/^,+|,+$/g, '')
      if (val && !skills.includes(val)) {
        setSkills(prev => [...prev, val])
        setSkillInput('')
      }
    }
  }

  const handleRemoveSkill = (skill) => {
    setSkills(prev => prev.filter(s => s !== skill))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please provide a squad name.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await createTeam(event.id, {
        name: name.trim(),
        description: description.trim(),
        preferred_skills: skills
      })

      if (res?.team) {
        toast.success(`Team "${res.team.name}" created! You are the Team Lead.`, { icon: '🚀' })
        setCreatedTeam(res.team)
      } else {
        throw new Error('Failed to create team record')
      }
    } catch (err) {
      setError(err?.message || 'Failed to create team. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = () => {
    if (!createdTeam?.team_code) return
    navigator.clipboard.writeText(createdTeam.team_code)
    setCopiedCode(true)
    toast.success('Team code copied to clipboard!')
    setTimeout(() => setCopiedCode(false), 2500)
  }

  const handleCopyLink = () => {
    if (!createdTeam?.team_code) return
    const inviteUrl = `${window.location.origin}/events?join_team=${createdTeam.team_code}`
    navigator.clipboard.writeText(inviteUrl)
    setCopiedLink(true)
    toast.success('Squad invite link copied to clipboard!')
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleFinish = () => {
    if (createdTeam && onTeamCreated) {
      onTeamCreated(createdTeam)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col mx-auto"
      >
        {!createdTeam ? (
          /* FORM VIEW */
          <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh] overflow-hidden">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 z-10 p-5 flex items-center justify-between shrink-0">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-1">
                  <Sparkles size={11} />
                  <span>Squad Formation</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Create Your Team
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  For: <span className="font-semibold text-slate-700">{event.title}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-xl hover:bg-slate-100"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 font-medium">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Team Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-mono">
                  Team / Squad Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quantum Hackers, Nebula Squad..."
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(null); }}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-medium"
                />
              </div>

              {/* Project Pitch / Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-mono">
                  Project Pitch / Description
                </label>
                <textarea
                  rows={3}
                  placeholder="What are you building? What idea, architecture, or campus problem are you tackling?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full min-h-[100px] bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all leading-relaxed resize-y"
                />
              </div>

              {/* Preferred Skills Chips */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-mono">
                  Preferred / Needed Skills
                </label>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap gap-2 items-center min-h-[44px]">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg text-xs font-semibold"
                    >
                      <Tag size={11} />
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-rose-600 transition-colors ml-0.5"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="Add skill (Enter)..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                    className="bg-transparent border-none text-xs text-slate-800 placeholder-slate-400 focus:outline-none flex-1 min-w-[120px] px-1 py-0.5"
                  />
                </div>

                <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px] text-slate-500">
                  <span className="font-medium">Presets:</span>
                  {skillPresets.map(s => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => {
                        if (!skills.includes(s)) setSkills(prev => [...prev, s])
                      }}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
                    >
                      +{s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Team Lead Badge Notice */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-3 text-xs text-amber-800">
                <Shield size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">Team Lead Role:</span> You will be designated as the Team Lead, granting authority to generate invite codes, review requests, and recruit campus participants.
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 z-10 p-4 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shadow-indigo-500/20 active:scale-95 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Generating Squad Code...</span>
                  </>
                ) : (
                  <>
                    <span>Create Team & Code</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* POST-CREATION IMMEDIATE TRANSITION VIEW */
          <div className="flex flex-col h-full max-h-[90vh] overflow-hidden">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 z-10 p-5 flex items-center justify-between shrink-0">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
                  <Check size={12} />
                  <span>Squad Registered</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  {createdTeam.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleFinish}
                className="text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-xl hover:bg-slate-100"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
                <Sparkles size={20} className="text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Your squad is active!</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Invite classmates directly with your unique team code, or recruit from the registered campus participant directory.
                  </p>
                </div>
              </div>

              {/* 1. Invite Friends Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                    Team Code (`team_code`)
                  </span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                    Share with Classmates
                  </span>
                </div>

                <div className="bg-white border border-indigo-200 rounded-xl p-3 flex items-center justify-between gap-3">
                  <span className="text-xl font-mono font-black text-indigo-700 tracking-wider pl-1">
                    {createdTeam.team_code}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                        copiedCode
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                      }`}
                    >
                      {copiedCode ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                        copiedLink
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {copiedLink ? <Check size={13} /> : <Share2 size={13} />}
                      <span>Invite Friends</span>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Anyone with this code can immediately join your team from their event registration portal.
                </p>
              </div>

              {/* 2. Request Members Directory Card */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                    Recruit Members
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                    Campus Directory
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Search through all registered participants matching your required tech stack and dispatch invitations.
                </p>
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
                >
                  <UserPlus size={14} />
                  <span>Request Members</span>
                </button>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 z-10 p-4 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={handleFinish}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs shadow-indigo-500/20 transition-all flex items-center gap-2"
              >
                <span>Go to Squad Dashboard</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Nested Request Members Modal */}
            {isRequestModalOpen && (
              <RequestMembersModal
                event={event}
                team={createdTeam}
                onClose={() => setIsRequestModalOpen(false)}
                onInviteSent={(student) => {
                  toast.success(`Invite sent to ${student.name}!`)
                }}
              />
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
