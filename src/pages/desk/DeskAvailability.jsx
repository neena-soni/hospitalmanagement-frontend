import { useEffect, useState } from 'react'
import {
  Calendar,
  Filter,
  Clock,
  DollarSign,
  User,
  AlertCircle,
  CheckCircle2,
  Stethoscope,
} from 'lucide-react'
import { getDoctors, getSpecialties, getDoctorCapacity, getBatchDoctorCapacity } from '../../api/doctors'
import { getAllPatients } from '../../api/patients'
import { bookAppointment } from '../../api/appointments'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'

export default function DeskAvailability() {
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split('T')[0]
  )
  const [doctors, setDoctors] = useState([])
  const [specialties, setSpecialties] = useState([])
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Map of doctorId -> CapacityResponse
  const [capacities, setCapacities] = useState({})
  const [capacitiesLoading, setCapacitiesLoading] = useState(false)

  // 1. Load specialties on initial mount
  useEffect(() => {
    getSpecialties()
      .then(setSpecialties)
      .catch((err) => console.error('Could not load specialties:', err))
  }, [])

  // 2. Load doctors when specialty changes
  useEffect(() => {
    loadDoctors()
  }, [selectedSpecialty])

  const loadDoctors = () => {
    setLoading(true)
    setError('')
    const params = {}
    if (selectedSpecialty) params.specialty = selectedSpecialty

    getDoctors(params)
      .then((docs) => {
        setDoctors(docs)
        fetchCapacities(docs, selectedDate)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  // 3. Whenever selectedDate changes, fetch batch capacity for all doctors in ONE call
  useEffect(() => {
    if (doctors.length > 0) {
      fetchCapacities(doctors, selectedDate)
    }
  }, [selectedDate])

  const fetchCapacities = async (docList, date) => {
    setCapacitiesLoading(true)
    try {
      // Fast single request batch endpoint
      const batchResults = await getBatchDoctorCapacity(date)
      setCapacities(batchResults || {})
    } catch (err) {
      console.warn('Batch capacity endpoint error, using fallback:', err)
      const newCapacities = {}
      await Promise.all(
        docList.map(async (doc) => {
          try {
            const cap = await getDoctorCapacity(doc.id, date)
            newCapacities[doc.id] = cap
          } catch {
            newCapacities[doc.id] = null
          }
        })
      )
      setCapacities(newCapacities)
    } finally {
      setCapacitiesLoading(false)
    }
  }

  // Calculate day of week for selectedDate (e.g. "MONDAY")
  const getSelectedDayOfWeek = (dateStr) => {
    if (!dateStr) return ''
    const parts = dateStr.split('-')
    const date = new Date(parts[0], parts[1] - 1, parts[2])
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
    return days[date.getDay()]
  }

  const selectedDay = getSelectedDayOfWeek(selectedDate)
  const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  const dayMap = {
    MON: 'MONDAY',
    TUE: 'TUESDAY',
    WED: 'WEDNESDAY',
    THU: 'THURSDAY',
    FRI: 'FRIDAY',
    SAT: 'SATURDAY',
    SUN: 'SUNDAY',
  }

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-widest text-clay">
          Registration Desk
        </span>
        <h2 className="mt-1 font-display text-3xl text-ink md:text-4xl">
          Doctor Availability Board
        </h2>
        <p className="mt-1 text-sm text-ink/60">
          Monitor physician shift schedules, working days, and live slot capacity for any consultation date.
        </p>
      </div>

      {/* 2. Controls Bar */}
      <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-clay" />
            <span className="text-xs font-medium text-ink/70">Check Date:</span>
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-full border border-ink/15 bg-sand/40 px-3.5 py-1.5 text-xs font-semibold text-ink focus:border-clay focus:outline-none"
            />
          </div>

          {/* Specialty Filter */}
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-ink/40" />
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="rounded-full border border-ink/15 bg-sand/40 px-3.5 py-1.5 text-xs font-medium text-ink focus:border-clay focus:outline-none cursor-pointer"
            >
              <option value="">All Specialties</option>
              {specialties.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Loading & Error States */}
      {loading && (
        <Card className="text-center py-12">
          <p className="text-ink/60">Loading doctor rosters…</p>
        </Card>
      )}

      {error && (
        <Card className="border-brick/30 bg-brick/5 text-center py-8">
          <p className="text-brick font-medium">{error}</p>
        </Card>
      )}

      {/* 3. Doctor Capacity Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {doctors.length === 0 ? (
            <div className="col-span-full">
              <Card className="text-center py-12 text-ink/50">
                No doctors found matching the selected criteria.
              </Card>
            </div>
          ) : (
            doctors.map((doc) => {
              const cap = capacities[doc.id]
              const isWorkingToday = doc.availableDays?.includes(selectedDay)
              const isDoctorActive = doc.available

              return (
                <Card
                  key={doc.id}
                  className="flex flex-col justify-between transition-all duration-150 hover:shadow-card hover:-translate-y-0.5"
                >
                  {/* Top Doctor Info */}
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-lg font-semibold text-ink">
                            Dr. {doc.name}
                          </h3>
                          {!isDoctorActive && (
                            <span className="rounded-full bg-brick/10 px-2 py-0.5 text-[10px] font-semibold text-brick">
                              On Leave
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-medium text-clay">
                          {doc.specialty}
                        </span>
                      </div>

                      {/* Consultation Fee */}
                      {doc.consultationFee != null && (
                        <div className="flex items-center text-xs font-semibold text-brass bg-sand/60 px-2.5 py-1 rounded-full border border-ink/5">
                          <DollarSign size={13} className="-mr-0.5" />
                          <span>{doc.consultationFee.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    {/* Shift Hours & Working Days */}
                    <div className="mt-4 space-y-2 border-t border-ink/5 pt-3 text-xs">
                      <div className="flex items-center justify-between text-ink/70">
                        <span className="flex items-center gap-1.5 text-ink/55">
                          <Clock size={13} className="text-clay" />
                          Shift Hours:
                        </span>
                        <span className="font-medium text-ink">
                          {doc.shiftStartTime && doc.shiftEndTime
                            ? `${doc.shiftStartTime.slice(0, 5)} - ${doc.shiftEndTime.slice(0, 5)}`
                            : '09:00 - 17:00'}
                        </span>
                      </div>

                      {/* Working Days Chips */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-ink/55">Schedule:</span>
                        <div className="flex items-center gap-1">
                          {daysOfWeek.map((dayAbbr) => {
                            const fullDay = dayMap[dayAbbr]
                            const isScheduled = doc.availableDays?.includes(fullDay)
                            const isCurrentSelected = fullDay === selectedDay

                            return (
                              <span
                                key={dayAbbr}
                                title={fullDay}
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                  isCurrentSelected && isScheduled
                                    ? 'bg-clay text-canvas ring-1 ring-clay'
                                    : isScheduled
                                    ? 'bg-sand text-ink/80'
                                    : 'bg-transparent text-ink/25'
                                }`}
                              >
                                {dayAbbr}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Live Capacity Bar for Selected Date */}
                    <div className="mt-4 rounded-xl bg-sand/35 p-3 border border-ink/5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink/60 font-medium">
                          Slots for {selectedDate}:
                        </span>
                        {capacitiesLoading || cap === undefined ? (
                          <span className="text-ink/40 text-[11px] animate-pulse">
                            Checking spots…
                          </span>
                        ) : cap ? (
                          <span
                            className={`font-semibold text-xs ${
                              cap.canBook
                                ? 'text-[#5C3E08]'
                                : 'text-brick'
                            }`}
                          >
                            {cap.message}
                          </span>
                        ) : (
                          <span className="text-ink/40 text-[11px]">
                            Capacity unavailable
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Footer Info */}
                  <div className="mt-5 flex items-center justify-between pt-3 border-t border-ink/5">
                    <span className="text-[11px] text-ink/50">
                      {isWorkingToday ? 'Scheduled on duty today' : 'Off-duty on this date'}
                    </span>

                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        !isDoctorActive
                          ? 'bg-brick/10 text-brick'
                          : !isWorkingToday
                          ? 'bg-sand text-ink/50'
                          : cap?.canBook
                          ? 'bg-[#FDEBB8] text-[#5C3E08]'
                          : 'bg-brick/10 text-brick'
                      }`}
                    >
                      {!isDoctorActive
                        ? 'On Leave'
                        : !isWorkingToday
                        ? 'Off-Duty'
                        : cap?.canBook
                        ? 'Open for Booking'
                        : 'Fully Booked'}
                    </span>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
