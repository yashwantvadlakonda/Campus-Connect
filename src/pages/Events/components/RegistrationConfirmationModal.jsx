import { motion } from 'framer-motion'
import { CheckCircle2, Ticket, Users, PlusCircle, ArrowRight, X, Calendar, MapPin, QrCode, Sparkles } from 'lucide-react'

export default function RegistrationConfirmationModal({ 
  event, 
  registrationData, 
  credentials, 
  onClose, 
  onCreateTeam, 
  onJoinTeam 
}) {
  const isTeamEvent = Boolean(event.is_team_event)
  const ticketId = registrationData?.ticket_id || `TKT-${String(event.id).slice(0, 4).toUpperCase()}-8492`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col mx-auto"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 z-10 p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 uppercase tracking-wider font-mono">
                <Sparkles size={11} /> Verified Entry
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Registration Confirmed!
              </h2>
            </div>
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
          {/* Ticket Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 relative overflow-hidden shadow-2xs">
            <div className="flex items-start justify-between gap-3 border-b border-dashed border-slate-300 pb-3 mb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block mb-0.5">
                  EVENT DIGITAL PASS
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">{event.title}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{event.venue || event.venue_name || 'Campus Venue'}</p>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs shrink-0 flex flex-col items-center">
                <QrCode size={36} className="text-slate-800" />
                <span className="text-[9px] font-mono text-slate-500 mt-0.5">{ticketId}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">ATTENDEE</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {credentials?.['Full Name'] || credentials?.name || 'Registered Student'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">STATUS</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ACID Seat Locked
                </span>
              </div>
            </div>
          </div>

          {/* Conditional Branching */}
          {!isTeamEvent ? (
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
              <Ticket className="text-indigo-600 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Solo Event Enrollment</h4>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  No squad formation needed for this event. Your pass has been saved to your student profile. Show up at the venue on schedule!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Collaborative Squad Formation</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Teams must have between {event.min_team_size || 2} and {event.max_team_size || 4} members. Choose your path:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Create Team */}
                <button
                  type="button"
                  onClick={onCreateTeam}
                  className="p-4 rounded-2xl border-2 border-indigo-600 bg-indigo-50/40 hover:bg-indigo-50 text-left transition-all hover:scale-[1.01] active:scale-[0.98] group flex flex-col justify-between space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <PlusCircle size={20} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                      Create a Team
                    </h5>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      Lead a new squad, generate a shareable team code, and recruit campus builders.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                    Start Squad <ArrowRight size={13} />
                  </span>
                </button>

                {/* 2. Join Team */}
                <button
                  type="button"
                  onClick={onJoinTeam}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-left transition-all hover:scale-[1.01] active:scale-[0.98] group flex flex-col justify-between space-y-3 shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                    <Users size={20} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                      Join a Team
                    </h5>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      Already have a team code from a friend? Enter it to join their squad.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    Enter Code <ArrowRight size={13} />
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 z-10 p-4 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs"
          >
            {isTeamEvent ? "I'll Team Up Later / Done" : "Done"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
