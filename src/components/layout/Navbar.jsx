import { Stethoscope, Calendar, Bot, Shield, UserCheck, Briefcase, User, Clock, Settings, Users } from 'lucide-react'
import Logo from './Logo'

export default function Navbar({
  currentRole = 'PATIENT',
  onSelectRole,
  activeTab = 'doctors',
  onSelectTab,
}) {
  const roles = [
    { id: 'PATIENT', label: 'Patient', icon: UserCheck },
    { id: 'DESK', label: 'Registration Desk', icon: Briefcase },
    { id: 'ADMIN', label: 'Admin', icon: Shield },
    { id: 'DOCTOR', label: 'Doctor', icon: Stethoscope },
  ]

  return (
    <header className="w-full px-6 md:px-12 pt-5 pb-3">
      {/* Top Bar: Logo & Role Switcher */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Logo size="md" />

        {/* Floating Role Switcher Pill (Reference 2 style) */}
        <div className="flex items-center gap-1.5 rounded-full bg-sand/70 p-1.5 shadow-soft border border-ink/10 backdrop-blur-sm self-start md:self-auto">
          {roles.map((r) => {
            const Icon = r.icon
            const isActive = currentRole === r.id
            return (
              <button
                key={r.id}
                onClick={() => onSelectRole(r.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer select-none ${
                  isActive
                    ? 'bg-clay text-canvas shadow-xs font-semibold'
                    : 'text-ink/65 hover:text-ink hover:bg-sand/80'
                }`}
              >
                <Icon size={13} />
                <span>{r.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Floating Sub-Navigation Bar for Patient Role */}
      {currentRole === 'PATIENT' && (
        <div className="mt-5 flex items-center justify-between gap-4">
          {/* Left Side: Work Navigation Capsules */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => onSelectTab('doctors')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium transition cursor-pointer select-none ${
                activeTab === 'doctors'
                  ? 'bg-clay text-canvas shadow-soft font-semibold'
                  : 'bg-sand/70 text-ink/70 hover:bg-sand hover:text-ink border border-ink/5'
              }`}
            >
              <Stethoscope size={15} />
              <span>Find Doctors</span>
            </button>

            <button
              onClick={() => onSelectTab('appointments')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium transition cursor-pointer select-none ${
                activeTab === 'appointments'
                  ? 'bg-clay text-canvas shadow-soft font-semibold'
                  : 'bg-sand/70 text-ink/70 hover:bg-sand hover:text-ink border border-ink/5'
              }`}
            >
              <Calendar size={15} />
              <span>My Appointments</span>
            </button>

            <button
              onClick={() => onSelectTab('ai')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium transition cursor-pointer select-none ${
                activeTab === 'ai'
                  ? 'bg-clay text-canvas shadow-soft font-semibold'
                  : 'bg-sand/70 text-ink/70 hover:bg-sand hover:text-ink border border-ink/5'
              }`}
            >
              <Bot size={15} />
              <span>AI Assistant</span>
            </button>
          </div>

          {/* Right Side: Standalone My Profile Capsule (Circle + Avatar Icon + "My Profile") */}
          <button
            onClick={() => onSelectTab('profile')}
            className={`flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer select-none shrink-0 border ${
              activeTab === 'profile'
                ? 'bg-clay text-canvas border-clay shadow-soft font-semibold'
                : 'bg-sand/80 text-ink/80 hover:bg-sand hover:text-ink border-ink/10 shadow-xs'
            }`}
          >
            {/* Round circle inside the capsule */}
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                activeTab === 'profile'
                  ? 'bg-canvas text-clay'
                  : 'bg-clay text-canvas shadow-xs'
              }`}
            >
              {/* Traditional avatar icon inside the circle */}
              <User size={15} />
            </div>
            <span>My Profile</span>
          </button>
        </div>
      )}

      {/* Floating Sub-Navigation Bar for Registration Desk Role */}
      {currentRole === 'DESK' && (
        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => onSelectTab('patients')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium transition cursor-pointer select-none ${
              activeTab === 'patients'
                ? 'bg-clay text-canvas shadow-soft font-semibold'
                : 'bg-sand/70 text-ink/70 hover:bg-sand hover:text-ink border border-ink/5'
            }`}
          >
            <UserCheck size={15} />
            <span>Patients & Walk-Ins</span>
          </button>

          <button
            onClick={() => onSelectTab('schedule')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium transition cursor-pointer select-none ${
              activeTab === 'schedule'
                ? 'bg-clay text-canvas shadow-soft font-semibold'
                : 'bg-sand/70 text-ink/70 hover:bg-sand hover:text-ink border border-ink/5'
            }`}
          >
            <Calendar size={15} />
            <span>Today’s Appointments</span>
          </button>

          <button
            onClick={() => onSelectTab('availability')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium transition cursor-pointer select-none ${
              activeTab === 'availability'
                ? 'bg-clay text-canvas shadow-soft font-semibold'
                : 'bg-sand/70 text-ink/70 hover:bg-sand hover:text-ink border border-ink/5'
            }`}
          >
            <Stethoscope size={15} />
            <span>Doctor Availability Board</span>
          </button>
        </div>
      )}

      {/* Floating Sub-Navigation Bar for Admin Role */}
      {currentRole === 'ADMIN' && (
        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => onSelectTab('doctors')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium transition cursor-pointer select-none ${
              activeTab === 'doctors'
                ? 'bg-clay text-canvas shadow-soft font-semibold'
                : 'bg-sand/70 text-ink/70 hover:bg-sand hover:text-ink border border-ink/5'
            }`}
          >
            <Stethoscope size={15} />
            <span>Physician Management</span>
          </button>

          <button
            onClick={() => onSelectTab('patients')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium transition cursor-pointer select-none ${
              activeTab === 'patients'
                ? 'bg-clay text-canvas shadow-soft font-semibold'
                : 'bg-sand/70 text-ink/70 hover:bg-sand hover:text-ink border border-ink/5'
            }`}
          >
            <Users size={15} />
            <span>Master Patient Registry</span>
          </button>

          <button
            onClick={() => onSelectTab('appointments')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium transition cursor-pointer select-none ${
              activeTab === 'appointments'
                ? 'bg-clay text-canvas shadow-soft font-semibold'
                : 'bg-sand/70 text-ink/70 hover:bg-sand hover:text-ink border border-ink/5'
            }`}
          >
            <Calendar size={15} />
            <span>Hospital Appointments</span>
          </button>
        </div>
      )}

      {/* Floating Sub-Navigation Bar for Doctor Role */}
      {currentRole === 'DOCTOR' && (
        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => onSelectTab('consultations')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium transition cursor-pointer select-none ${
              activeTab === 'consultations'
                ? 'bg-clay text-canvas shadow-soft font-semibold'
                : 'bg-sand/70 text-ink/70 hover:bg-sand hover:text-ink border border-ink/5'
            }`}
          >
            <Clock size={15} />
            <span>My Consultations</span>
          </button>

          <button
            onClick={() => onSelectTab('settings')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium transition cursor-pointer select-none ${
              activeTab === 'settings'
                ? 'bg-clay text-canvas shadow-soft font-semibold'
                : 'bg-sand/70 text-ink/70 hover:bg-sand hover:text-ink border border-ink/5'
            }`}
          >
            <Settings size={15} />
            <span>Shift & Availability</span>
          </button>
        </div>
      )}
    </header>
  )
}
