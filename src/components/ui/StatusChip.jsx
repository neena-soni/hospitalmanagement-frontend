import { CalendarCheck, CalendarX, AlertTriangle } from 'lucide-react'

export default function StatusChip({ status }) {
  const configs = {
    BOOKED: {
      label: 'Booked',
      icon: CalendarCheck,
      // Luminous warm Brass / Golden Amber (Active & Confirmed)
      classes: 'bg-[#FDEBB8] text-[#5C3E08] border border-[#DCA23A] shadow-xs font-semibold',
    },
    CANCELLED: {
      label: 'Cancelled',
      icon: CalendarX,
      // Warm Terracotta / Brick Red (Cancelled by patient or desk)
      classes: 'bg-[#FAD9D0] text-[#8C2310] border border-[#DE7864] shadow-xs font-semibold',
    },
    CLINIC_CANCELLED: {
      label: 'Clinic Cancelled',
      icon: CalendarX,
      // Warm Terracotta / Brick Red (Doctor emergency leave / clinic closed)
      classes: 'bg-[#FAD9D0] text-[#8C2310] border border-[#DE7864] shadow-xs font-semibold',
    },
    NO_SHOW: {
      label: 'No-Show',
      icon: AlertTriangle,
      // Warm Mineral Stone / Ash Charcoal (Patient did not show up)
      classes: 'bg-[#EAE4DC] text-[#38312B] border border-[#B8AEA3] shadow-xs font-semibold',
    },
  }

  const config = configs[status] || {
    label: status,
    icon: CalendarCheck,
    classes: 'bg-sand text-ink border border-ink/20 font-semibold',
  }

  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-colors select-none ${config.classes}`}
    >
      <Icon size={14} className="shrink-0" />
      <span>{config.label}</span>
    </span>
  )
}
