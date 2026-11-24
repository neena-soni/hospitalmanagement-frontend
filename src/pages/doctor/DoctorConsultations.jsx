import { useEffect, useState } from 'react'
import {
  Calendar,
  Clock,
  User,
  Phone,
  FileText,
  AlertCircle,
  CheckCircle2,
  Stethoscope,
  Filter,
} from 'lucide-react'
import {
  getAppointmentsByDoctor,
  markNoShow,
} from '../../api/appointments'
import { getDoctors } from '../../api/doctors'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import StatusChip from '../../components/ui/StatusChip'
import Modal from '../../components/ui/Modal'

export default function DoctorConsultations({ activeDoctorId, onSelectDoctorId }) {
  const [doctors, setDoctors] = useState([])
  const [currentDoctorId, setCurrentDoctorId] = useState(activeDoctorId || '')
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Sub-filter for doctor queue: 'TODAY' | 'UPCOMING' | 'HISTORY'
  const [queueTab, setQueueTab] = useState('TODAY')

  // Action Confirmation Modal
  const [actionTarget, setActionTarget] = useState(null) // { type: 'CANCEL' | 'NO_SHOW', appt }
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // 1. Load all doctors on mount
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

  // 2. Load appointments whenever currentDoctorId changes
  useEffect(() => {
    if (currentDoctorId) {
      loadDoctorSchedule(currentDoctorId)
    }
  }, [currentDoctorId])

  const loadDoctorSchedule = (docId) => {
    setLoading(true)
    setError('')
    getAppointmentsByDoctor(Number(docId))
      .then(setAppointments)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  const showSuccess = (msg) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const handleConfirmAction = async () => {
    if (!actionTarget || actionLoading) return

    setActionLoading(true)
    setActionError('')

    try {
      await markNoShow(actionTarget.appt.id)
      showSuccess('Patient consultation marked as No-Show.')
      setActionTarget(null)
      loadDoctorSchedule(currentDoctorId)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]

  // Categorize appointments
  const todayAppointments = appointments.filter(
    (a) => a.appointmentDate === todayStr && a.status === 'BOOKED'
  )
  const upcomingAppointments = appointments.filter(
    (a) => a.appointmentDate > todayStr && a.status === 'BOOKED'
  )
  const historyAppointments = appointments.filter(
    (a) => a.appointmentDate < todayStr || a.status !== 'BOOKED'
  )

  const activeDoctor = doctors.find((d) => String(d.id) === String(currentDoctorId))

  const displayedList =
    queueTab === 'TODAY'
      ? todayAppointments
      : queueTab === 'UPCOMING'
      ? upcomingAppointments
      : historyAppointments

  return (
    <div className="space-y-8">
      {/* 1. Header Banner & Doctor Switcher */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-clay">
            Physician Workspace
          </span>
          <h2 className="mt-1 font-display text-3xl text-ink md:text-4xl">
            Clinical Consultations
          </h2>
          <p className="mt-1 text-sm text-ink/60">
            Review patient queue, review symptoms and triage notes, and track daily consultations.
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
      {successMessage && (
        <div className="flex items-center gap-2 rounded-2xl bg-[#FDEBB8] p-3.5 text-xs text-[#5C3E08] border border-[#DCA23A] shadow-soft">
          <CheckCircle2 size={16} className="text-[#957445]" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* 2. Doctor Profile Mini-Bar */}
      {activeDoctor && (
        <Card className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-clay text-canvas font-bold text-sm shadow-xs">
              {activeDoctor.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-ink">
                Dr. {activeDoctor.name}
              </h3>
              <p className="text-xs text-clay font-medium">
                {activeDoctor.specialty} • Shift:{' '}
                {activeDoctor.shiftStartTime
                  ? `${activeDoctor.shiftStartTime.slice(0, 5)} - ${activeDoctor.shiftEndTime.slice(0, 5)}`
                  : '09:00 - 17:00'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 3. Sub-Navigation Tabs: Today vs Upcoming vs History */}
      <div className="flex items-center gap-2 border-b border-ink/10 pb-3">
        <button
          onClick={() => setQueueTab('TODAY')}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition cursor-pointer select-none ${
            queueTab === 'TODAY'
              ? 'bg-clay text-canvas shadow-xs'
              : 'bg-sand/40 text-ink/70 hover:bg-sand hover:text-ink'
          }`}
        >
          <Clock size={13} />
          <span>Today’s Queue ({todayAppointments.length})</span>
        </button>

        <button
          onClick={() => setQueueTab('UPCOMING')}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition cursor-pointer select-none ${
            queueTab === 'UPCOMING'
              ? 'bg-clay text-canvas shadow-xs'
              : 'bg-sand/40 text-ink/70 hover:bg-sand hover:text-ink'
          }`}
        >
          <Calendar size={13} />
          <span>Upcoming Consultations ({upcomingAppointments.length})</span>
        </button>

        <button
          onClick={() => setQueueTab('HISTORY')}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition cursor-pointer select-none ${
            queueTab === 'HISTORY'
              ? 'bg-clay text-canvas shadow-xs'
              : 'bg-sand/40 text-ink/70 hover:bg-sand hover:text-ink'
          }`}
        >
          <span>Past Visits & Log ({historyAppointments.length})</span>
        </button>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <Card className="text-center py-12">
          <p className="text-ink/60">Loading doctor consultations…</p>
        </Card>
      )}

      {error && (
        <Card className="border-brick/30 bg-brick/5 text-center py-8">
          <p className="text-brick font-medium">{error}</p>
        </Card>
      )}

      {/* 4. Consultation Cards / Table */}
      {!loading && !error && (
        <div className="space-y-4">
          {displayedList.length === 0 ? (
            <Card className="text-center py-12 text-ink/50">
              {queueTab === 'TODAY'
                ? 'No consultations scheduled for today.'
                : queueTab === 'UPCOMING'
                ? 'No upcoming appointments booked on your roster.'
                : 'No past consultation history recorded.'}
            </Card>
          ) : (
            displayedList.map((appt) => {
              const isToday = appt.appointmentDate === todayStr
              const isBooked = appt.status === 'BOOKED'

              return (
                <Card
                  key={appt.id}
                  className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between transition-all hover:shadow-card"
                >
                  {/* Left: Patient Details & Reason */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sand text-ink font-bold text-xs shrink-0 mt-0.5">
                      <User size={16} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display text-base font-semibold text-ink">
                          {appt.patientName}
                        </h4>
                        <span className="text-[10px] text-ink/40 font-mono">
                          ID #{appt.patientId}
                        </span>
                        <StatusChip status={appt.status} />
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink/60">
                        <span className="flex items-center gap-1 font-medium text-ink/80">
                          <Calendar size={13} className="text-clay" />
                          {appt.appointmentDate}
                          {isToday && (
                            <span className="rounded-full bg-[#FDEBB8] px-2 py-0.2 text-[10px] font-bold text-[#5C3E08] ml-1">
                              Today
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Reason / Clinical Notes */}
                      <div className="mt-2 text-xs text-ink/75 bg-sand/35 p-2.5 rounded-xl border border-ink/5 max-w-xl">
                        <span className="font-semibold text-ink">Chief Complaint / Reason: </span>
                        <span>{appt.reason || 'General clinical consultation'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center justify-end gap-2 border-t border-ink/5 pt-3 md:border-0 md:pt-0 shrink-0">
                    {isBooked ? (
                      isToday ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setActionTarget({ type: 'NO_SHOW', appt })
                          }
                        >
                          Mark No-Show
                        </Button>
                      ) : (
                        <span className="text-xs text-ink/50 font-medium bg-sand/40 px-2.5 py-1 rounded-full">
                          Scheduled
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-ink/40 font-medium">
                        {appt.status === 'CANCELLED' ? 'Cancelled' : 'Concluded'}
                      </span>
                    )}
                  </div>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* 5. Action Confirmation Modal (No-Show Only) */}
      <Modal
        isOpen={!!actionTarget}
        onClose={() => setActionTarget(null)}
        title="Mark Patient as Absent / No-Show"
      >
        {actionTarget && (
          <div className="space-y-4">
            <p className="text-sm text-ink/80">
              Confirm recording absent / no-show status for patient{' '}
              <strong>{actionTarget.appt.patientName}</strong> for today’s appointment?
            </p>

            {actionError && (
              <div className="flex items-center gap-2 rounded-xl bg-brick/10 p-3 text-xs text-brick">
                <AlertCircle size={16} />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActionTarget(null)}
              >
                Go Back
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={actionLoading}
                loading={actionLoading}
                onClick={handleConfirmAction}
              >
                Confirm No-Show
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
