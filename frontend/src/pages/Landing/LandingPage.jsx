import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Sparkles, ArrowRight, CheckCircle2, Users, Calendar, 
  MessageSquare, ShieldCheck, Code2, Database, 
  Cpu, Layers, ExternalLink, Flame, MapPin, Heart, 
  ChevronRight, ArrowUpRight, Mail, Send, MessageCircle,
  Bell, Check, X, Shield, Terminal, Activity, Lock,
  GraduationCap, Award, BookOpen, Layers3, UserCheck,
  CheckCircle, Clock, Building2, BarChart3, AlertCircle
} from 'lucide-react'
import { Navbar } from '../../components/layout/Navbar'
import { toast } from 'react-hot-toast'


export default function LandingPage() {
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleContactSubmit = (e) => {
    e.preventDefault()
    setSubmitting(true)
    setTimeout(() => {
      toast.success('Inquiry submitted! Our student project leads will reach out.', {
        style: {
          background: '#ffffff',
          color: '#0f172a',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }
      })
      setContactForm({ name: '', email: '', message: '' })
      setSubmitting(false)
    }, 600)
  }


  // 4-Step True Student Journey
  const studentSteps = [
    {
      step: '01',
      title: 'Set Your Skill Matrix',
      description: 'Create your verified student profile with up to 15 skills, 15 interests, branch, year, and a 280-character bio. Let other builders know exactly what you bring to the table.',
      tag: 'PROFILE CONFIGURATION',
      badge: 'Up to 15 Skills'
    },
    {
      step: '02',
      title: 'Swipe to Register for Events',
      description: 'Browse a tailored deck of upcoming hackathons and workshops sorted by your interests. Swipe right to instantly secure your seat—with guaranteed capacity checks so events never overbook.',
      tag: 'ACID CAPACITY LOCK',
      badge: 'Zero Overbooking'
    },
    {
      step: '03',
      title: 'Swipe to Match with Teammates',
      description: 'Browse other students ranked specifically by the skills your team is missing. Swipe right to express interest in teaming up without awkward cold-messaging in huge groups.',
      tag: 'HEURISTIC MATCHING',
      badge: 'Complementary Skills'
    },
    {
      step: '04',
      title: 'Mutual Match & Instant Chat',
      description: 'When both students swipe right on each other, a match is created, unlocking an instant private chat room to brainstorm ideas and finalize your roster before the submission deadline.',
      tag: 'REAL-TIME WEBSOCKETS',
      badge: 'Instant Private Rooms'
    }
  ]

  // Dual-Sided Portals
  const studentPortalFeatures = [
    {
      title: 'Dual Swipe Decks',
      description: 'One intuitive gesture deck for discovering upcoming campus competitions, and a dedicated teammate deck showing students missing from your stack.',
      icon: Layers3
    },
    {
      title: 'Matches & Real-Time Chat',
      description: 'Zero spam. Messaging unlocks only when both students express mutual interest, providing an instant collaborative workspace.',
      icon: MessageCircle
    },
    {
      title: 'My Events Calendar',
      description: 'Keep track of all your confirmed registrations, submission deadlines, and team rosters in one synchronized view with 1-click cancellation.',
      icon: Calendar
    }
  ]

  const facultyPortalFeatures = [
    {
      title: 'Restricted Provisioning',
      description: 'Strict, dedicated faculty login with zero public signups. Admin credentials are provisioned directly via authorized university scripts.',
      icon: ShieldCheck
    },
    {
      title: 'Live Event Control & Expiry',
      description: 'Publish and validate new hackathons, workshops, and seat quotas. Automatically cleans up expired events once deadlines pass.',
      icon: Clock
    },
    {
      title: 'Real-Time Analytics Dashboard',
      description: 'Monitor live registration volume, observe student signups, and track the most in-demand campus skills across departments.',
      icon: BarChart3
    }
  ]

  // Core Campus Impact Pillars
  const impactPillars = [
    {
      title: 'College Departments & Tech Clubs',
      description: 'Computer Science, IEEE Student Branches, ACM Chapters, and Developer Student Clubs can announce competitions with instant verified student reach.',
      icon: Building2
    },
    {
      title: 'Cross-Branch Teaming',
      description: 'Breaks down academic silos by connecting CSE developers with AIML researchers, ECE IoT builders, and design enthusiasts.',
      icon: Users
    },
    {
      title: 'Guaranteed Capacity Management',
      description: 'Eliminates Google Form chaos and duplicate submissions with strict database row locks that prevent seat overbooking.',
      icon: CheckCircle2
    }
  ]


  return (
    <div id="home" className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-indigo-500/20 selection:text-indigo-900 relative overflow-x-clip">
      
      {/* Subtle top ambient light gradient */}
      <div 
        className="fixed top-0 left-0 right-0 h-[500px] bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.08),rgba(255,255,255,0))] pointer-events-none -z-0" 
        aria-hidden="true"
      />

      {/* 3. PREMIUM STICKY NAVBAR */}
      <Navbar />

      <main>
        {/* ========================================================
            1. HERO SECTION (Clean Typography & Metrics Ribbon)
        ======================================================== */}
        <section className="relative pt-16 md:pt-24 pb-20 md:pb-28 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            
            {/* Practical Campus Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono border border-emerald-200 bg-emerald-50 text-emerald-700 mb-8 max-w-full shadow-sm"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="truncate font-semibold">A Centralised Hub for Campus Hackathons, Workshops & Team Building</span>
            </motion.div>

            {/* Target Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.5 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-extrabold -tracking-[0.035em] text-slate-900 max-w-4xl mx-auto leading-[1.08]"
            >
              Never Miss a Campus Event.{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-800 bg-clip-text text-transparent">
                Never Build Alone Again.
              </span>
            </motion.h1>

            {/* Target Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.5 }}
              className="mt-6 text-slate-600 font-normal leading-relaxed text-base md:text-lg max-w-3xl mx-auto"
            >
              Discover college hackathons before registration closes and swipe through student builders to find the exact teammates whose skills complete your project roster.
            </motion.p>

            {/* Light Mode Dual CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.5 }}
              className="mt-10 flex flex-col items-center"
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
                <Link
                  to="/signup"
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3.5 rounded-xl shadow-sm shadow-indigo-500/10 flex items-center justify-center gap-2 active:scale-95 text-sm transition-all"
                >
                  <GraduationCap size={18} />
                  <span>Enter Student Portal</span>
                  <ArrowRight size={16} />
                </Link>

                <Link
                  to="/admin/login"
                  className="w-full sm:w-auto border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium px-6 py-3.5 rounded-xl shadow-sm flex items-center justify-center gap-2 active:scale-95 text-sm transition-all"
                >
                  <ShieldCheck size={17} className="text-slate-500" />
                  <span>Faculty & Admin Login</span>
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:gap-3 text-xs font-mono text-slate-500">
                <span>Verified Student Profiles</span>
                <span>•</span>
                <span>Guaranteed Seat Allocation</span>
                <span>•</span>
                <span>Role-Based Faculty Access</span>
              </div>
            </motion.div>



          </div>
        </section>

        {/* ========================================================
            3. THE CORE PROBLEM (The "Why")
        ======================================================== */}
        <section id="problem" className="scroll-mt-16 py-20 md:py-28 px-4 sm:px-6 lg:px-8 border-t border-slate-200 bg-white relative">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-xs font-mono tracking-wider uppercase text-indigo-600 font-semibold">
                THE CAMPUS PROBLEM
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold -tracking-[0.035em] text-slate-900 mt-2.5">
                Why Campus Competitions Feel Chaotic
              </h2>
              <p className="text-slate-600 font-normal leading-relaxed text-base mt-3">
                Every semester, incredible talent goes unnoticed and ambitious projects fall apart simply because information and team creation are broken.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Problem 1: Scattered Info */}
              <div className="p-8 rounded-3xl bg-slate-50/60 border border-slate-200/80 shadow-sm space-y-4">
                <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                  <AlertCircle size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Scattered Information & Missed Deadlines
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Hackathons, workshops, and coding contests are scattered across dozens of unorganized WhatsApp groups, noisy Discord channels, and physical notice board posters. Students only hear about high-value competitions after registration forms have already closed.
                </p>
                <div className="pt-2 flex items-center gap-2 text-xs font-mono text-amber-800">
                  <span className="font-semibold">PROBLEM:</span>
                  <span>Zero centralized university discovery feed</span>
                </div>
              </div>

              {/* Problem 2: Random Team Formation */}
              <div className="p-8 rounded-3xl bg-slate-50/60 border border-slate-200/80 shadow-sm space-y-4">
                <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center">
                  <Users size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Random Team Formation & Skill Gaps
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Most hackathons require a balanced team, yet students are forced to team up strictly with immediate friend circles. A student skilled in backend Python has no structured way to discover someone proficient in Machine Learning, UI/UX, or frontend architecture across other branches.
                </p>
                <div className="pt-2 flex items-center gap-2 text-xs font-mono text-rose-800">
                  <span className="font-semibold">PROBLEM:</span>
                  <span>Friend-circle bias leaves critical roles unfilled</span>
                </div>
              </div>
            </div>

            {/* The Solution Banner */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-xs font-mono bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold">
                  THE CAMPUSCONNECT SOLUTION
                </div>
                <h4 className="text-xl font-bold text-slate-900">
                  A Centralised, Algorithmic Campus Hub
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  One platform uniting live event discovery with intelligent, swipe-based skill matching—ensuring no student misses out on competitions and every team has a complete, complementary tech stack.
                </p>
              </div>

              <Link
                to="/signup"
                className="shrink-0 bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all text-xs font-mono tracking-wider uppercase active:scale-95 flex items-center gap-2 shadow-sm shadow-indigo-500/10"
              >
                <span>Join Campus Directory</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================
            4. HOW THE PRODUCT ACTUALLY WORKS (The 4-Step Journey)
        ======================================================== */}
        <section id="about" className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 border-t border-slate-200 relative bg-[#FAFAFA]">
          <div className="max-w-6xl mx-auto space-y-16">
            
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-xs font-mono tracking-wider uppercase text-indigo-600 font-semibold">
                HOW IT WORKS
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold -tracking-[0.035em] text-slate-900 mt-2.5">
                The 4-Step Student Journey
              </h2>
              <p className="text-slate-600 font-normal leading-relaxed text-base mt-3">
                From setting up your academic skills to closing your hackathon submission roster, here is how students experience the platform day-to-day.
              </p>
            </div>

            {/* 4-Step Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {studentSteps.map((stepItem, idx) => (
                <motion.div
                  key={stepItem.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-2xl font-black font-mono text-slate-300 group-hover:text-indigo-600 transition-colors">
                        {stepItem.step}
                      </span>
                      <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-semibold">
                        {stepItem.badge}
                      </span>
                    </div>

                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                      {stepItem.tag}
                    </p>
                    <h3 className="text-lg font-bold text-slate-900 mb-3 leading-snug">
                      {stepItem.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {stepItem.description}
                    </p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>STATUS</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Check size={12} /> Active Step
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </section>

        {/* ========================================================
            5. THE TWO SEPARATE PORTALS (Dual-Sided Architecture)
        ======================================================== */}
        <section id="features" className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 border-t border-slate-200 bg-white relative">
          <div className="max-w-6xl mx-auto space-y-16">
            
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-xs font-mono tracking-wider uppercase text-indigo-600 font-semibold">
                DUAL-SIDED PLATFORM
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold -tracking-[0.035em] text-slate-900 mt-2.5">
                Two Dedicated Portals. One Unified Network.
              </h2>
              <p className="text-slate-600 font-normal leading-relaxed text-base mt-3">
                Built specifically to serve the distinct operational needs of active campus students and university event administrators.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* SIDE A: For Students */}
              <div className="p-8 rounded-3xl bg-slate-50/60 border border-slate-200 shadow-sm hover:border-slate-300 transition-all space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">For Students</h3>
                      <p className="text-xs font-mono text-slate-500">DISCOVER • MATCH • TEAM UP</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 font-medium">
                    Open Registration
                  </span>
                </div>

                <div className="space-y-4">
                  {studentPortalFeatures.map((feat) => (
                    <div key={feat.title} className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-1 shadow-sm">
                      <div className="flex items-center gap-2">
                        <feat.icon size={15} className="text-indigo-600" />
                        <h4 className="text-sm font-semibold text-slate-900">{feat.title}</h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pl-6">
                        {feat.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <Link
                    to="/signup"
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm shadow-indigo-500/10"
                  >
                    <span>Launch Student Dashboard</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* SIDE B: For Faculty & Club Organizers */}
              <div className="p-8 rounded-3xl bg-slate-50/60 border border-slate-200 shadow-sm hover:border-slate-300 transition-all space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">For Faculty & Organizers</h3>
                      <p className="text-xs font-mono text-slate-500">PUBLISH • VALIDATE • TRACK</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold">
                    Restricted Auth
                  </span>
                </div>

                <div className="space-y-4">
                  {facultyPortalFeatures.map((feat) => (
                    <div key={feat.title} className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-1 shadow-sm">
                      <div className="flex items-center gap-2">
                        <feat.icon size={15} className="text-emerald-600" />
                        <h4 className="text-sm font-semibold text-slate-900">{feat.title}</h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pl-6">
                        {feat.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <Link
                    to="/admin/login"
                    className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <Lock size={14} className="text-slate-600" />
                    <span>Access Faculty Portal</span>
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================
            6. CAMPUS IMPACT & APPLICATIONS
        ======================================================== */}
        <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 border-t border-slate-200 relative bg-[#FAFAFA]">
          <div className="max-w-6xl mx-auto space-y-14">
            
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-xs font-mono tracking-wider uppercase text-indigo-600 font-semibold">
                REAL-WORLD UTILITY
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold -tracking-[0.035em] text-slate-900 mt-2.5">
                Campus Deployment & Use Cases
              </h2>
              <p className="text-slate-600 font-normal leading-relaxed text-base mt-3">
                Engineered for immediate deployment across university departments, clubs, and annual technical symposiums.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {impactPillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
                    <pillar.icon size={18} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </section>

                {/* ========================================================
            8. GET IN TOUCH / UNIVERSITY PARTNERSHIPS (LIGHT THEME)
        ======================================================== */}
        <section id="contact" className="scroll-mt-16 py-24 md:py-32 px-4 sm:px-6 lg:px-8 border-t border-slate-200 relative bg-[#FAFAFA]">
          <div className="max-w-4xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-mono tracking-wider uppercase text-indigo-600 font-semibold">
                GET IN TOUCH
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold -tracking-[0.035em] text-slate-900 mt-2.5">
                Bring CampusConnect to Your College
              </h2>
              <p className="text-slate-600 font-normal leading-relaxed text-base mt-3">
                Are you a technical club lead, department head, or student council representative? Connect with our project leads for deployment assistance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Info Column */}
              <div className="md:col-span-5 space-y-4">
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                      <Mail size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">CAMPUS INQUIRIES</p>
                      <p className="text-sm font-semibold text-slate-900">contact@campusconnect.app</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                      <Building2 size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">DEPARTMENT LAB</p>
                      <p className="text-sm font-semibold text-slate-900">Computer Science Dept • Block 4</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                      <MessageCircle size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">STUDENT DEVELOPER NETWORK</p>
                      <p className="text-sm font-semibold text-slate-900">discord.gg/campusconnect</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-xs text-slate-600 font-mono">
                  <span className="text-emerald-600 font-bold">●</span> <strong>Direct Response:</strong> Inquiries are routed directly to student project coordinators within 24 hours.
                </div>
              </div>

              {/* Form Column */}
              <div className="md:col-span-7 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-md">
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Yashwanth V."
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">
                      College / Institutional Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="student@college.edu"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">
                      Inquiry Details
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Tell us about your campus club, upcoming hackathon, or feedback..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm shadow-indigo-500/10 active:scale-95 transition-all"
                  >
                    <Send size={15} />
                    <span>{submitting ? 'Transmitting...' : 'Send Message'}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            9. FINAL PRE-FOOTER CALL TO ACTION (LIGHT THEME)
        ======================================================== */}
        <section className="py-20 md:py-24 px-4 sm:px-6 lg:px-8 border-t border-slate-200 relative bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="relative rounded-3xl bg-slate-50 border border-slate-200 p-8 sm:p-12 text-center shadow-sm overflow-hidden">
              <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                <h2 className="text-3xl sm:text-5xl font-extrabold -tracking-[0.035em] text-slate-900">
                  Ready to Build Your Winning Roster?
                </h2>
                <p className="text-slate-600 font-normal leading-relaxed text-base">
                  Stop missing out on campus hackathons. Build your skill matrix, register with guaranteed seats, and match with the teammates you need today.
                </p>

                <div className="pt-4 flex flex-col items-center">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Link
                      to="/signup"
                      className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3.5 rounded-xl shadow-sm shadow-indigo-500/10 active:scale-95 text-sm transition-all"
                    >
                      <GraduationCap size={17} />
                      <span>Enter Student Portal</span>
                      <ArrowRight size={16} />
                    </Link>
                    <Link
                      to="/admin/login"
                      className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold px-6 py-3.5 rounded-xl transition-all text-sm shadow-sm"
                    >
                      <ShieldCheck size={16} />
                      <span>Faculty Login</span>
                    </Link>
                  </div>
                  <p className="mt-3 text-xs font-mono text-slate-400">
                    CAMPUS EVENT & TEAM FINDER • ACADEMIC YEAR 2026
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER (LIGHT THEME) */}
      <footer className="border-t border-slate-200 bg-white py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-sm">
                <Sparkles size={14} />
              </div>
              <span className="text-sm font-semibold tracking-tight text-slate-900">CampusConnect</span>
            </div>
            <p className="text-slate-500 text-xs max-w-sm leading-relaxed font-normal">
              A centralised academic web platform combining verified event discovery with gesture-driven skill matching for students and faculty organizers.
            </p>
          </div>

          <div className="space-y-2.5">
            <p className="font-mono text-slate-800 uppercase tracking-wider text-[11px] font-semibold">Portals</p>
            <ul className="space-y-2">
              <li><Link to="/signup" className="hover:text-slate-900 transition-colors">Student Registration</Link></li>
              <li><Link to="/login" className="hover:text-slate-900 transition-colors">Student Sign In</Link></li>
              <li><Link to="/admin/login" className="hover:text-slate-900 transition-colors">Faculty / Admin Login</Link></li>
              <li><Link to="/events" className="hover:text-slate-900 transition-colors">Live Event Deck</Link></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <p className="font-mono text-slate-800 uppercase tracking-wider text-[11px] font-semibold">Tech Stack</p>
            <ul className="space-y-2">
              <li><span className="hover:text-slate-900 transition-colors">PostgreSQL & Supabase</span></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <p className="font-mono text-slate-800 uppercase tracking-wider text-[11px] font-semibold">Compliance</p>
            <ul className="space-y-2">
              <li><span className="hover:text-slate-900 cursor-pointer">Academic Integrity</span></li>
              <li><span className="hover:text-slate-900 cursor-pointer">Student Data Privacy</span></li>
              <li><span className="hover:text-slate-900 cursor-pointer">Campus Code of Conduct</span></li>
              <li><span className="hover:text-slate-900 cursor-pointer">Fair Seat Allocation</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-200 text-center sm:text-left">
          <p>© 2026 CampusConnect (Campus Event & Team Finder). Designed for collegiate builders.</p>
        </div>
      </footer>
    </div>
  )
}
