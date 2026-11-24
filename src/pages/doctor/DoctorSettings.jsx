import { useEffect, useState } from 'react'
import {
  Clock,
  DollarSign,
  Calendar,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
} from 'lucide-react'
import {
  getDoctors,
  getDoctorById,
  getDoctorCapacity,
} from '../../api/doctors'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

export default function DoctorSettings({ activeDoctorId, onSelectDoctorId }) {
  const [doctors, setDoctors] = useState([])
  const [currentDoctorId, setCurrentDoctorId] = useState(activeDoctorId || '')
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Date Capacity Checker
  const [checkDate, setCheckDate] = useState(
    () => new Date().toISOString().split('T')[0]
  )
  const [capacity, setCapacity] = useState(null)
  const [capacityLoading, setCapacityLoading] = useState(false)

  // Status message
  const [statusMessage, setStatusMessage] = useState('')

  // 1. Load doctor roster
  useEffect(() => {
    getDoctors()
      .then((docs) => {
        setDoctors(docs)
        if (docs.length > 0 && !currentDoctorId) {
          const firstId = String(docs[0].id)
          setCurrentDoctorId(firstId)
          if (onSelectDoctorId) onSelectDoctorId(firstId)
        }
      })
      .catch((err) => console.error('Could not load doctors:', err))
  }, [])

  // 2. Load active doctor details
  useEffect(() => {
    if (currentDoctorId) {
      loadDoctorProfile(currentDoctorId)
      loadCapacity(currentDoctorId, checkDate)
    }
  }, [currentDoctorId])

  // 3. Whenever checkDate changes, re-fetch capacity
  useEffect(() => {
    if (currentDoctorId && checkDate) {
      loadCapacity(currentDoctorId, checkDate)
    }
  }, [checkDate])

  const loadDoctorProfile = (docId) => {
    setLoading(true)
    setError('')
    getDoctorById(Number(docId))
      .then(setDoctor)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  const loadCapacity = (docId, date) => {
    setCapacityLoading(true)
    getDoctorCapacity(Number(docId), date)
      .then(setCapacity)
      .catch(() => setCapacity(null))
      .finally(() => setCapacityLoading(false))
  }

  const showStatus = (msg) => {
    setStatusMessage(msg)
    setTimeout(() => setStatusMessage(''), 3000)
  }

  // Note: Only Admins can change a doctor's on-leave status so that hospital management
  // stays in control of clinical schedules and can manage patient bookings.

  const allDays = [
    { label: 'Mon', value: 'MONDAY' },
    { label: 'Tue', value: 'TUESDAY' },
    { label: 'Wed', value: 'WEDNESDAY' },
    { label: 'Thu', value: 'THURSDAY' },
    { label: 'Fri', value: 'FRIDAY' },
    { label: 'Sat', value: 'SATURDAY' },
    { label: 'Sun', value: 'SUNDAY' },
  ]

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-clay">
            Physician Workspace
          </span>
          <h2 className="mt-1 font-display text-3xl text-ink md:text-4xl">
            My Availability & Shift Settings
          </h2>
          <p className="mt-1 text-sm text-ink/60">
            Manage your on-duty clinical status, review scheduled shift hours, and monitor live slot saturation.
          </p>
        </div>

        {/* Doctor Persona Switcher Dropdown */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Stethoscope size={16} className="text-clay" />
          <span className="text-xs font-medium text-ink/70">Physician:</span>
          <select
            value={currentDoctorId}
            onChange={(e) => {
              setCurrentDoctorId(e.target.value)
              if (onSelectDoctorId) onSelectDoctorId(e.target.value)
            }}
            className="rounded-full border border-ink/15 bg-sand/50 px-3.5 py-1.5 text-xs font-semibold text-ink focus:border-clay focus:outline-none cursor-pointer"
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.name} ({d.specialty})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Success Notification */}
      {statusMessage && (
        <div className="flex items-center gap-2 rounded-2xl bg-[#FDEBB8] p-3.5 text-xs text-[#5C3E08] border border-[#DCA23A] shadow-soft">
          <CheckCircle2 size={16} className="text-[#957445]" />
          <span className="font-medium">{statusMessage}</span>
        </div>
      )}

      {/* Loading & Error States */}
      {loading && (
        <Card className="text-center py-12">
          <p className="text-ink/60">Loading physician settings…</p>
        </Card>
      )}

      {error && (
        <Card className="border-brick/30 bg-brick/5 text-center py-8">
          <p className="text-brick font-medium">{error}</p>
        </Card>
      )}

      {/* 2. Main Profile & Availability Card */}
      {!loading && !error && doctor && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Left Column: Doctor Profile & Leave Status */}
          <Card className="md:col-span-1 space-y-6">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-clay text-canvas font-bold text-lg shadow-soft">
                {doctor.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <h3 className="mt-3 font-display text-xl font-bold text-ink">
                Dr. {doctor.name}
              </h3>
              <p className="text-xs text-clay font-medium">{doctor.specialty}</p>
              <p className="mt-1 text-xs text-ink/50">{doctor.email || doctor.phoneNumber}</p>
            </div>

            {/* Duty Status (Read-only for Doctor; only Admins can toggle leave) */}
            <div className="rounded-2xl bg-sand/40 p-4 border border-ink/5 space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink/60 block">
                Duty Status
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-ink block">
                    {doctor.available ? 'Active & Consulting' : 'On Leave'}
                  </span>
                  <span className="text-[10px] text-ink/50 block">
                    {doctor.available
                      ? 'Open to patient appointments'
                      : 'Slots locked for consultations'}
                  </span>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                    doctor.available
                      ? 'bg-[#FDEBB8] text-[#5C3E08] border-[#DCA23A]'
                      : 'bg-brick/10 text-brick border-brick/30'
                  }`}
                >
                  {doctor.available ? 'Active' : 'On Leave'}
                </span>
              </div>
              <p className="text-[10px] text-ink/40 pt-1 border-t border-ink/5">
                Note: Leave status is officially managed by Hospital Administration.
              </p>
            </div>

            {/* Fee */}
            <div className="flex items-center justify-between text-xs border-t border-ink/5 pt-3">
              <span className="text-ink/60">Consultation Fee:</span>
              <span className="font-bold text-brass text-sm">
                ${doctor.consultationFee ? doctor.consultationFee.toFixed(2) : '0.00'}
              </span>
            </div>
          </Card>

          {/* Right Column: Shift Hours & Capacity Tracker */}
          <div className="md:col-span-2 space-y-6">
            {/* Shift Timings & Working Days Card */}
            <Card className="space-y-4">
              <h4 className="font-display text-base font-semibold text-ink">
                Weekly Working Hours & Schedule
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-sand/30 p-3 border border-ink/5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-ink/50 flex items-center gap-1">
                    <Clock size={12} className="text-clay" /> Shift Timing
                  </span>
                  <div className="mt-1 font-display text-lg font-bold text-ink">
                    {doctor.shiftStartTime && doctor.shiftEndTime
                      ? `${doctor.shiftStartTime.slice(0, 5)} - ${doctor.shiftEndTime.slice(0, 5)}`
                      : '09:00 - 17:00'}
                  </div>
                  <span className="text-[11px] text-ink/50">Standard consultation window</span>
                </div>

                <div className="rounded-xl bg-sand/30 p-3 border border-ink/5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-ink/50 flex items-center gap-1">
                    <Calendar size={12} className="text-clay" /> Max Daily Slots
                  </span>
                  <div className="mt-1 font-display text-lg font-bold text-ink">
                    10 Slots / Day
                  </div>
                  <span className="text-[11px] text-ink/50">Strict hospital safety limit</span>
                </div>
              </div>

              {/* Working Days */}
              <div>
                <span className="text-xs font-semibold text-ink/70 block mb-2">
                  Operating Days of the Week:
                </span>
                <div className="flex flex-wrap gap-2">
                  {allDays.map((d) => {
                    const isWorking = doctor.availableDays?.includes(d.value)
                    return (
                      <span
                        key={d.value}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                          isWorking
                            ? 'bg-clay text-canvas shadow-xs'
                            : 'bg-sand/30 text-ink/25'
                        }`}
                      >
                        {d.label} {isWorking ? '✓' : ''}
                      </span>
                    )
                  })}
                </div>
              </div>
            </Card>

            {/* Live Capacity Meter for Selected Date */}
            <Card className="space-y-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h4 className="font-display text-base font-semibold text-ink">
                    Live Slot Saturation Checker
                  </h4>
                  <p className="text-xs text-ink/60">
                    Verify slot occupancy and remaining spots for any consultation date.
                  </p>
                </div>

                <input
                  type="date"
                  value={checkDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setCheckDate(e.target.value)}
                  className="rounded-full border border-ink/15 bg-sand/40 px-3.5 py-1.5 text-xs font-semibold text-ink focus:border-clay focus:outline-none self-start md:self-auto"
                />
              </div>

              {capacityLoading ? (
                <div className="py-6 text-center text-xs text-ink/50 animate-pulse">
                  Querying clinic capacity…
                </div>
              ) : capacity ? (
                <div className="space-y-2 rounded-2xl bg-sand/30 p-4 border border-ink/5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs font-medium">
                    <span className="text-ink/70">
                      Booked on {checkDate}: <strong>{capacity.booked}</strong> / {capacity.maxPerDay || 10}
                    </span>
                    <span
                      className={`font-bold ${
                        capacity.canBook ? 'text-[#5C3E08]' : 'text-brick'
                      }`}
                    >
                      {capacity.message}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-ink/60 pt-2 border-t border-ink/5">
                    <span>Available Spots: <strong className="text-ink">{capacity.remaining}</strong></span>
                    <span>Status: <strong className={capacity.canBook ? 'text-[#5C3E08]' : 'text-brick'}>{capacity.canBook ? 'Accepting Patients' : 'Full / Closed'}</strong></span>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-ink/50">
                  Select a valid date to check capacity.
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
