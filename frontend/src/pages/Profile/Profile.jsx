import { useState, useEffect, useRef } from 'react'
import { getProfile, updateProfile } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Loader2, Save, Plus, RefreshCw,
  Sparkles, CheckCircle2, Code, Heart, ShieldCheck
} from 'lucide-react'

const yearLabels = {
  '1': 'Freshman',
  '2': 'Sophomore',
  '3': 'Junior',
  '4': 'Senior',
  Freshman: 'Freshman',
  Sophomore: 'Sophomore',
  Junior: 'Junior',
  Senior: 'Senior',
  'Graduate Student': 'Graduate Student'
}

const normalizeTags = (tags) => Array.isArray(tags)
  ? [...new Map(tags
    .map((tag) => String(tag).trim())
    .filter(Boolean)
    .map((tag) => [tag.toLowerCase(), tag])).values()]
  : []

const toProfileForm = (profile = {}) => ({
  name: profile.full_name || profile.name || '',
  major: profile.major || profile.branch || '',
  year: yearLabels[String(profile.year)] || '',
  bio: profile.bio || '',
  skills: normalizeTags(profile.skills),
  interests: normalizeTags(profile.interests),
  github: profile.github || '',
  linkedin: profile.linkedin || ''
})

export default function Profile() {
  const { user, updateProfileCache } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [syncWarning, setSyncWarning] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const dirtyRef = useRef(false)
  const [formData, setFormData] = useState({
    name: '',
    major: '',
    year: '',
    bio: '',
    skills: [],
    interests: [],
    github: '',
    linkedin: ''
  })
  
  const [newSkill, setNewSkill] = useState('')
  const [newInterest, setNewInterest] = useState('')

  useEffect(() => {
    let active = true
    const fetchProfile = async () => {
      try {
        const data = await getProfile()
        const source = Array.isArray(data) ? data[0] : data
        if (!source || typeof source !== 'object') {
          throw new Error('The profile service returned no saved profile.')
        }
        if (!active) return
        const savedProfile = toProfileForm(source)
        setFormData(savedProfile)
        setSyncWarning(source.sync_warning || '')
        dirtyRef.current = false
        updateProfileCache({
          ...source,
          full_name: savedProfile.name,
          major: savedProfile.major,
          branch: savedProfile.major,
          year: source.year || ''
        })
      } catch (error) {
        if (!active) return
        console.error('Failed to load profile:', error)
        setLoadError('We could not load your saved profile. Check your connection and try again.')
        toast.error('Unable to load your profile.')
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchProfile()
    return () => {
      active = false
    }
  }, [user?.id, reloadKey, updateProfileCache])

  useEffect(() => {
    const syncProfile = (event) => {
      if (event.detail?.userId !== user?.id || dirtyRef.current) return
      setFormData(toProfileForm(event.detail.profile))
    }
    window.addEventListener('campus_profile_updated', syncProfile)
    window.addEventListener('campus_profile_remote_updated', syncProfile)
    return () => {
      window.removeEventListener('campus_profile_updated', syncProfile)
      window.removeEventListener('campus_profile_remote_updated', syncProfile)
    }
  }, [user?.id])

  const handleChange = (e) => {
    setFormData((current) => ({ ...current, [e.target.name]: e.target.value }))
    dirtyRef.current = true
  }

  const handleAddItem = (field, value, setter) => {
    if (!value.trim()) return
    const trimmed = value.trim()
    if (trimmed.length > 50) {
      toast.error('Tags must be 50 characters or fewer.')
      return
    }
    if (formData[field].some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      setter('')
      return
    }
    if (formData[field].length >= 30) {
      toast.error('You can add up to 30 tags in each category.')
      return
    }
    setFormData((current) => ({ ...current, [field]: [...current[field], trimmed] }))
    setter('')
    dirtyRef.current = true
  }

  const handleRemoveItem = (field, itemToRemove) => {
    setFormData((current) => ({
      ...current,
      [field]: current[field].filter(item => item !== itemToRemove)
    }))
    dirtyRef.current = true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const name = formData.name.trim()
    const major = formData.major.trim()
    if (!name || !major || !formData.year) {
      toast.error('Add your name, academic major, and class year before saving.')
      return
    }
    if (name.length > 100 || major.length > 100 || formData.bio.length > 1000) {
      toast.error('Check the field length limits and try again.')
      return
    }
    if ([...formData.skills, ...formData.interests].some((item) => !item.trim() || item.length > 50)) {
      toast.error('Tags must contain 1 to 50 non-whitespace characters.')
      return
    }
    setSaving(true)
    try {
      const result = await updateProfile({
        full_name: name,
        major,
        year: ({ Freshman: '1', Sophomore: '2', Junior: '3', Senior: '4' })[formData.year] || formData.year,
        bio: formData.bio.trim(),
        skills: formData.skills,
        interests: formData.interests,
        github: formData.github.trim(),
        linkedin: formData.linkedin.trim()
      })
      const saved = Array.isArray(result) ? result[0] : result
      if (!saved || typeof saved !== 'object') {
        throw new Error('The server could not confirm the profile update.')
      }
      const savedForm = toProfileForm(saved)
      setFormData(savedForm)
      dirtyRef.current = false
      setSyncWarning(saved.sync_warning || '')
      updateProfileCache({
        ...saved,
        full_name: savedForm.name,
        major: savedForm.major,
        branch: savedForm.major
      })
      if (saved.sync_warning) {
        toast.error(saved.sync_warning)
      } else {
        toast.success('Profile saved and synced to your account database.')
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
      toast.error(error.message || 'Profile could not be saved. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const suggestedSkills = ['React', 'Python', 'FastAPI', 'Figma', 'TypeScript', 'Docker', 'PostgreSQL', 'UI/UX']
  const readiness = Math.min(100,
    (formData.name ? 20 : 0) +
    (formData.major ? 15 : 0) +
    (formData.bio.trim().length >= 40 ? 25 : formData.bio.trim() ? 15 : 0) +
    Math.min(formData.skills.length, 5) * 5 +
    Math.min(formData.interests.length, 4) * 5 +
    (formData.github.trim() ? 5 : 0) +
    (formData.linkedin.trim() ? 5 : 0)
  )
  const readinessLabel = readiness >= 80 ? 'High' : readiness >= 55 ? 'Good' : 'Getting started'
  const readinessColors = readiness >= 80
    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
    : readiness >= 55
      ? 'bg-blue-50 border-blue-200 text-blue-700'
      : 'bg-amber-50 border-amber-200 text-amber-700'

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center flex-col gap-3">
        <Loader2 className="animate-spin text-indigo-600 w-9 h-9" />
        <p className="text-sm text-slate-500">Loading your saved profile...</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="max-w-xl mx-auto mt-12 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <RefreshCw size={21} />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Your profile is unavailable</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{loadError}</p>
        <button
          type="button"
          onClick={() => {
            setLoadError('')
            setLoading(true)
            setReloadKey((current) => current + 1)
          }}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-700 hover:shadow-md"
        >
          <RefreshCw size={15} />
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-16 space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Account</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Student profile</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-500">
          Keep your academic details, skills, and interests current to help the right teammates find you.
        </p>
      </div>

      {/* Top Banner & Header */}
      <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="relative flex h-36 items-start justify-between overflow-hidden bg-gradient-to-br from-indigo-700 via-blue-600 to-violet-700 p-6 sm:h-40">
          <div className="pointer-events-none absolute -right-10 -top-28 h-72 w-72 rounded-full border border-white/15 bg-white/10 blur-2xl transition-transform duration-500 group-hover:scale-110" />
          <div className="pointer-events-none absolute bottom-[-7rem] left-1/3 h-56 w-56 rounded-full bg-violet-300/20 blur-3xl" />
          <span className="relative inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md transition-all duration-200 hover:bg-white/25 hover:shadow-md">
            <Sparkles size={13} className="text-amber-500" />
            Campus profile
          </span>
          <span className="relative hidden items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            Changes save to your account
          </span>
        </div>

        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14">
          <div className="flex items-end gap-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-indigo-50 to-violet-100 text-3xl font-extrabold text-indigo-700 shadow-lg">
              {formData.name.trim().slice(0, 2).toUpperCase() || <Code size={28} />}
            </div>
            <div className="mb-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">{formData.name || 'Your name'}</h2>
                <ShieldCheck size={20} className="text-indigo-600" />
              </div>
              <p className="mt-1 truncate text-xs font-medium text-slate-500 sm:text-sm">
                {[formData.major, formData.year].filter(Boolean).join(' · ') || 'Add your academic details'}
              </p>
            </div>
          </div>

          <div className={`flex w-fit items-center gap-2 rounded-xl border px-4 py-2.5 text-xs transition-all duration-200 hover:shadow-md ${readinessColors}`}>
            <CheckCircle2 size={15} />
            <span className="opacity-80">Match readiness</span>
            <span className="font-bold">{readiness}% {readinessLabel}</span>
          </div>
        </div>
      </div>

      {/* Main Profile Form */}
      <form noValidate onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 sm:p-7 lg:p-8 hover:shadow-md">
        {syncWarning && (
          <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {syncWarning}
          </div>
        )}
        <div className="flex flex-col gap-1 border-b border-slate-100 pb-5">
          <h2 className="text-lg font-bold text-slate-900">Profile details</h2>
          <p className="text-sm text-slate-500">Your saved details power your compatibility and teammate recommendations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Full Name</label>
            <input
              name="name"
              type="text"
              className="input-field"
              value={formData.name}
              onChange={handleChange}
              maxLength={100}
              autoComplete="name"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Academic Major</label>
            <input
              name="major"
              type="text"
              className="input-field"
              value={formData.major}
              onChange={handleChange}
              maxLength={100}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Class Year</label>
            <select
              name="year"
              className="input-field cursor-pointer"
              value={formData.year}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select your class year</option>
              <option value="Freshman">Freshman</option>
              <option value="Sophomore">Sophomore</option>
              <option value="Junior">Junior</option>
              <option value="Senior">Senior</option>
              <option value="Graduate Student">Graduate Student</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">GitHub URL</label>
            <input
              name="github"
              type="url"
              className="input-field"
              placeholder="https://github.com/username"
              value={formData.github}
              onChange={handleChange}
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">LinkedIn URL</label>
            <input
              name="linkedin"
              type="url"
              className="input-field"
              placeholder="https://linkedin.com/in/username"
              value={formData.linkedin}
              onChange={handleChange}
              maxLength={200}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Student Bio & Teaming Goals</label>
          <textarea
            name="bio"
            rows={3}
            className="input-field resize-none"
            placeholder="Share your technical interests, past projects, or what kind of hackathon team you want to join..."
            value={formData.bio}
            onChange={handleChange}
            maxLength={1000}
          />
          <p className="mt-1 text-right text-[11px] text-slate-400">{formData.bio.length}/1000</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
          {/* Skills Management */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Code size={14} className="text-indigo-600" />
                Technical Skills ({formData.skills.length})
              </label>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                className="input-field py-2.5 text-xs"
                placeholder="Type skill & press Enter (e.g. React)"
                aria-label="Add a technical skill"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                maxLength={50}
                disabled={saving}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddItem('skills', newSkill, setNewSkill)
                  }
                }}
              />
              <button
                type="button"
                onClick={() => handleAddItem('skills', newSkill, setNewSkill)}
                aria-label="Add technical skill"
                disabled={saving}
                className="btn-secondary px-3.5 py-2 rounded-xl text-xs shrink-0 transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[48px] p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <AnimatePresence initial={false}>
                {formData.skills.map(skill => (
                  <motion.span
                    key={skill}
                    layout
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.16 }}
                    className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all duration-200 hover:shadow-md"
                  >
                    {skill}
                    <button
                      type="button"
                      aria-label={`Remove ${skill}`}
                      onClick={() => handleRemoveItem('skills', skill)}
                      disabled={saving}
                      className="text-indigo-500 hover:text-rose-600 transition-colors disabled:cursor-not-allowed"
                    >
                      ×
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>

            {/* Quick add suggestions */}
            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-500 font-semibold">Suggested:</span>
              {suggestedSkills.filter(s => !formData.skills.includes(s)).slice(0, 4).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleAddItem('skills', s, setNewSkill)}
                  className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-all duration-200 hover:shadow-md"
                >
                  +{s}
                </button>
              ))}
            </div>
          </div>

          {/* Interests Management */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Heart size={14} className="text-purple-600" />
                Interests & Domains ({formData.interests.length})
              </label>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                className="input-field py-2.5 text-xs"
                placeholder="Type interest & press Enter (e.g. AI/ML)"
                aria-label="Add an interest"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                maxLength={50}
                disabled={saving}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddItem('interests', newInterest, setNewInterest)
                  }
                }}
              />
              <button
                type="button"
                onClick={() => handleAddItem('interests', newInterest, setNewInterest)}
                aria-label="Add interest"
                disabled={saving}
                className="btn-secondary px-3.5 py-2 rounded-xl text-xs shrink-0 transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[48px] p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <AnimatePresence initial={false}>
                {formData.interests.map(interest => (
                  <motion.span
                    key={interest}
                    layout
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.16 }}
                    className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all duration-200 hover:shadow-md"
                  >
                    {interest}
                    <button
                      type="button"
                      aria-label={`Remove ${interest}`}
                      onClick={() => handleRemoveItem('interests', interest)}
                      disabled={saving}
                      className="text-purple-500 hover:text-rose-600 transition-colors disabled:cursor-not-allowed"
                    >
                      ×
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-6 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2 py-3 px-8 text-sm rounded-xl shadow-sm shadow-indigo-500/10 active:scale-95 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            <span>{saving ? 'Syncing profile…' : 'Save Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
