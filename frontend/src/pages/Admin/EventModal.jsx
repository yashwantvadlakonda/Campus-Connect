import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Loader2, Plus, AlertCircle, Trophy, CalendarDays, MapPin, Users, FileText, Link2, Sparkles } from 'lucide-react'

const EMPTY_FORM = {
  title: '',
  event_type: 'hackathon',
  description: '',
  club: '',
  banner_url: '',
  venue_name: '',
  participation_mode: 'Offline',
  capacity: 100,
  is_team_event: true,
  min_team_size: 2,
  max_team_size: 4,
  registration_start: '',
  deadline_at: '',
  start_at: '',
  expire_at: '',
  event_date: '',
  eligibility: '',
  registration_link: '',
  approval_required: true,
  status: 'draft',
  themes: [],
  problem_statements: [],
  prizes: [],
  sponsors: [],
  organizers: [],
}

function toInput(value) {
  if (!value) return ''
  return String(value).slice(0, 16)
}

function combineDateTime(dateValue, timeValue) {
  if (!dateValue) return ''
  return `${dateValue}T${timeValue || '00:00'}`
}

function ChipInput({ label, values, onChange, placeholder }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const value = draft.trim()
    if (!value) return
    if (!values.some(item => item.toLowerCase() === value.toLowerCase())) {
      onChange([...values, value])
    }
    setDraft('')
  }
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 font-mono">{label}</label>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={placeholder}
          className="flex-1 h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
        <button
          type="button"
          onClick={add}
          className="h-10 px-3 rounded-xl bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 transition-colors"
          aria-label={`Add ${label}`}
        >
          <Plus size={15} />
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {values.map(value => (
            <span key={value} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-medium px-2 py-0.5 rounded-lg">
              {value}
              <button type="button" onClick={() => onChange(values.filter(item => item !== value))} className="hover:text-rose-600" aria-label={`Remove ${value}`}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function EventModal({ event, defaultType = 'hackathon', onClose, onSave }) {
  const isEdit = Boolean(event)
  const [form, setForm] = useState(() => {
    if (!event) {
      return { ...EMPTY_FORM, event_type: defaultType, is_team_event: defaultType === 'hackathon' }
    }
    return {
      ...EMPTY_FORM,
      ...event,
      is_team_event: Boolean(event.is_team_event),
      themes: event.themes || [],
      problem_statements: event.problem_statements || [],
      prizes: event.prizes || [],
      sponsors: event.sponsors || [],
      organizers: event.organizers || [],
      registration_start: toInput(event.registration_start),
      deadline_at: toInput(event.deadline_at),
      start_at: toInput(event.start_at),
      expire_at: toInput(event.expire_at),
      status: event.status === 'Active' ? 'published' : (event.status || 'draft'),
    }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (error) setError(null)
  }

  const validate = () => {
    if (form.title.trim().length < 3) return 'Title must be at least 3 characters.'
    if (!form.club.trim()) return 'Organizing club or department is required.'
    if (Number(form.capacity) <= 0) return 'Capacity must be greater than zero.'
    if (form.is_team_event && Number(form.max_team_size) < Number(form.min_team_size)) {
      return 'Maximum team size cannot be smaller than the minimum.'
    }
    if (form.deadline_at && form.start_at && form.deadline_at > form.start_at) {
      return 'Registration deadline must be on or before the event start.'
    }
    return null
  }

  const submit = async (status) => {
    const validation = validate()
    if (validation) {
      setError(validation)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        club: form.club.trim(),
        capacity: Number(form.capacity),
        min_team_size: Number(form.min_team_size),
        max_team_size: Number(form.max_team_size),
        event_date: form.event_date || (form.start_at ? form.start_at.slice(0, 10) : ''),
        start_time: form.start_at ? form.start_at.slice(11, 19) || '10:00:00' : '10:00:00',
        end_time: form.expire_at ? form.expire_at.slice(11, 19) || '18:00:00' : '18:00:00',
        tags: form.themes.length ? form.themes : form.tags,
        required_skills: form.themes,
        status,
      }
      await onSave(payload)
    } catch (err) {
      setError(err.message || 'Unable to save this program.')
    } finally {
      setSaving(false)
    }
  }

  const fieldClass = 'w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
  const labelClass = 'block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 font-mono'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={() => !saving && onClose()} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3 p-5 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              {form.event_type === 'hackathon' ? <Trophy size={18} /> : <CalendarDays size={18} />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{isEdit ? 'Edit program' : 'Create program'}</h2>
              <p className="text-[11px] text-slate-500">Published programs appear instantly on the student dashboard.</p>
            </div>
          </div>
          <button onClick={onClose} disabled={saving} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
              <Sparkles size={13} /> Basics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Title *</label>
                <input value={form.title} onChange={e => update('title', e.target.value)} className={fieldClass} placeholder="Campus AI Sprint 2026" />
              </div>
              <div>
                <label className={labelClass}>Type</label>
                <select value={form.event_type} onChange={e => update('event_type', e.target.value)} className={fieldClass}>
                  <option value="hackathon">Hackathon</option>
                  <option value="workshop">Workshop</option>
                  <option value="seminar">Seminar</option>
                  <option value="competition">Competition</option>
                  <option value="event">Other event</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Organizer / Club *</label>
                <input value={form.club} onChange={e => update('club', e.target.value)} className={fieldClass} placeholder="Coding Club" />
              </div>
              <div>
                <label className={labelClass}>Banner image URL</label>
                <input value={form.banner_url} onChange={e => update('banner_url', e.target.value)} className={fieldClass} placeholder="https://..." />
              </div>
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="What is this program about?"
              />
            </div>
            <ChipInput label="Themes & tags" values={form.themes} onChange={value => update('themes', value)} placeholder="AI, FinTech, Sustainability" />
          </section>

          <section className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
              <CalendarDays size={13} /> Schedule
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Registration opens</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={form.registration_start.slice(0, 10)} onChange={e => update('registration_start', combineDateTime(e.target.value, form.registration_start.slice(11, 16) || '09:00'))} className={fieldClass} />
                  <input type="time" value={form.registration_start.slice(11, 16)} onChange={e => update('registration_start', combineDateTime(form.registration_start.slice(0, 10), e.target.value))} className={fieldClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Registration closes</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={form.deadline_at.slice(0, 10)} onChange={e => update('deadline_at', combineDateTime(e.target.value, form.deadline_at.slice(11, 16) || '23:59'))} className={fieldClass} />
                  <input type="time" value={form.deadline_at.slice(11, 16)} onChange={e => update('deadline_at', combineDateTime(form.deadline_at.slice(0, 10), e.target.value))} className={fieldClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Event starts</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={form.start_at.slice(0, 10)} onChange={e => update('start_at', combineDateTime(e.target.value, form.start_at.slice(11, 16) || '10:00'))} className={fieldClass} />
                  <input type="time" value={form.start_at.slice(11, 16)} onChange={e => update('start_at', combineDateTime(form.start_at.slice(0, 10), e.target.value))} className={fieldClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Event ends</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={form.expire_at.slice(0, 10)} onChange={e => update('expire_at', combineDateTime(e.target.value, form.expire_at.slice(11, 16) || '18:00'))} className={fieldClass} />
                  <input type="time" value={form.expire_at.slice(11, 16)} onChange={e => update('expire_at', combineDateTime(form.expire_at.slice(0, 10), e.target.value))} className={fieldClass} />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
              <MapPin size={13} /> Venue & participation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Venue</label>
                <input value={form.venue_name} onChange={e => update('venue_name', e.target.value)} className={fieldClass} placeholder="Innovation Lab" />
              </div>
              <div>
                <label className={labelClass}>Mode</label>
                <select value={form.participation_mode} onChange={e => update('participation_mode', e.target.value)} className={fieldClass}>
                  <option>Offline</option>
                  <option>Online</option>
                  <option>Hybrid</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Capacity</label>
                <input type="number" min="1" value={form.capacity} onChange={e => update('capacity', e.target.value)} className={fieldClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Eligibility criteria</label>
              <input value={form.eligibility} onChange={e => update('eligibility', e.target.value)} className={fieldClass} placeholder="Open to all engineering students" />
            </div>
          </section>

          <section className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
              <Users size={13} /> Teams & registration
            </h3>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <input
                id="team-event"
                type="checkbox"
                checked={form.is_team_event}
                onChange={e => update('is_team_event', e.target.checked)}
                className="w-4 h-4 accent-indigo-600"
              />
              <label htmlFor="team-event" className="text-xs font-semibold text-slate-700">Team-based participation</label>
            </div>
            {form.is_team_event && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Minimum team size</label>
                  <input type="number" min="1" value={form.min_team_size} onChange={e => update('min_team_size', e.target.value)} className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}>Maximum team size</label>
                  <input type="number" min="1" value={form.max_team_size} onChange={e => update('max_team_size', e.target.value)} className={fieldClass} />
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>External registration link</label>
                <div className="relative">
                  <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={form.registration_link} onChange={e => update('registration_link', e.target.value)} className={`${fieldClass} pl-9`} placeholder="https:// (optional)" />
                </div>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.approval_required}
                    onChange={e => update('approval_required', e.target.checked)}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  Require faculty approval for registrations
                </label>
              </div>
            </div>
          </section>

          <section className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
              <FileText size={13} /> Hackathon details
            </h3>
            <ChipInput label="Problem statements" values={form.problem_statements} onChange={value => update('problem_statements', value)} placeholder="Add a problem statement" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ChipInput label="Prizes" values={form.prizes} onChange={value => update('prizes', value)} placeholder="₹50,000 pool" />
              <ChipInput label="Sponsors" values={form.sponsors} onChange={value => update('sponsors', value)} placeholder="TechCorp" />
            </div>
            <ChipInput label="Organizers" values={form.organizers} onChange={value => update('organizers', value)} placeholder="Coding Club" />
          </section>
        </div>

        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-slate-500 order-2 sm:order-1">
            Drafts stay hidden from students until published.
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
            <button
              type="button"
              onClick={() => submit('draft')}
              disabled={saving}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-60"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={() => submit('published')}
              disabled={saving}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Save & publish' : 'Publish program'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
