import { useEffect, useState } from 'react'
import {
  Calendar,
  Filter,
  UserX,
  XCircle,
  AlertCircle,
  CheckCircle2,
  Stethoscope,
  User,
} from 'lucide-react'
import {
  getAppointmentsByDate,
  cancelAppointment,
  markNoShow,
} from '../../api/appointments'
import { getDoctors } from '../../api/doctors'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import StatusChip from '../../components/ui/StatusChip'
import Modal from '../../components/ui/Modal'

export default function DeskSchedule() {
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split('T')[0]
  )
  const [doctors, setDoctors] = useState([])
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('')
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Action Confirmation Modal State
  const [actionTarget, setActionTarget] = useState(null) // { type: 'CANCEL' | 'NO_SHOW', appt }
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  // 1. Load doctors for filter dropdown
  useEffect(() => {
    getDoctors()
      .then(setDoctors)
      .catch((err) => console.error('Could not load doctors:', err))
  }, [])

  // 2. Load appointments whenever selectedDate changes
  useEffect(() => {
    loadSchedule()
  }, [selectedDate])

  const loadSchedule = () => {
    setLoading(true)
    setError('')
    getAppointmentsByDate(selectedDate)
      .then(setAppointments)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  // Handle Action Submission (Cancel or No-Show)
  const handleConfirmAction = async () => {
    if (!actionTarget || actionLoading) return // Debounce guard

    setActionLoading(true)
    setActionError('')
    setActionSuccess('')

    try {
      if (actionTarget.type === 'NO_SHOW') {
        await markNoShow(actionTarget.appt.id)
        setActionSuccess('Patient successfully marked as No-Show.')
      } else {
        await cancelAppointment(actionTarget.appt.id)
        setActionSuccess('Appointment successfully cancelled.')
      }

      loadSchedule()
      setTimeout(() => {
        setActionTarget(null)
        setActionSuccess('')
      }, 1200)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]

  // Filter by doctor in browser
  const filteredAppointments = selectedDoctorFilter
    ? appointments.filter((a) => String(a.doctorId) === selectedDoctorFilter)
    : appointments

  const bookedCount = filteredAppointments.filter((a) => a.status === 'BOOKED').length
  const cancelledCount = filteredAppointments.filter(
    (a) => a.status === 'CANCELLED' || a.status === 'CLINIC_CANCELLED'
  ).length
  const noShowCount = filteredAppointments.filter((a) => a.status === 'NO_SHOW').length

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-widest text-clay">
          Registration Desk
        </span>
        <h2 className="mt-1 font-display text-3xl text-ink md:text-4xl">
          Appointments & Queue
        </h2>
        <p className="mt-1 text-sm text-ink/60">
          Monitor scheduled patients by date, record front-desk cancellations, and mark no-shows.
        </p>
      </div>

      {/* 2. Controls & Summary Bar */}
      <Card className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between py-5">
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-clay" />
            <span className="text-xs font-medium text-ink/70">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-full border border-ink/15 bg-sand/40 px-3.5 py-1.5 text-xs font-semibold text-ink focus:border-clay focus:outline-none"
            />
          </div>

          {/* Doctor Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-ink/40" />
            <select
              value={selectedDoctorFilter}
              onChange={(e) => setSelectedDoctorFilter(e.target.value)}
              className="rounded-full border border-ink/15 bg-sand/40 px-3.5 py-1.5 text-xs font-medium text-ink focus:border-clay focus:outline-none cursor-pointer"
            >
              <option value="">All Consulting Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.name} ({d.specialty})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Count Badges */}
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#FDEBB8] px-3 py-1 text-xs font-semibold text-[#5C3E08] border border-[#DCA23A]">
            {bookedCount} Booked
          </span>
          <span className="rounded-full bg-[#FAD9D0] px-3 py-1 text-xs font-semibold text-[#8C2310] border border-[#DE7864]">
            {cancelledCount} Cancelled
          </span>
          <span className="rounded-full bg-[#EAE4DC] px-3 py-1 text-xs font-semibold text-[#38312B] border border-[#B8AEA3]">
            {noShowCount} No-Show
          </span>
        </div>
      </Card>

      {/* Loading & Error States */}
      {loading && (
        <Card className="text-center py-12">
          <p className="text-ink/60">Loading appointments for {selectedDate}…</p>
        </Card>
      )}

      {error && (
        <Card className="border-brick/30 bg-brick/5 text-center py-8">
          <p className="text-brick font-medium">{error}</p>
        </Card>
      )}

      {/* 3. Schedule Table */}
      {!loading && !error && (
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sand/60 text-ink/70 uppercase tracking-wider text-[11px] font-semibold border-b border-ink/10">
                <tr>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Doctor</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Desk Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-ink/50">
                      No appointments scheduled on {selectedDate}.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((appt) => {
                    const isFuture = selectedDate > todayStr
                    const isBooked = appt.status === 'BOOKED'

                    return (
                      <tr key={appt.id} className="hover:bg-sand/30 transition-colors">
                        {/* Patient */}
                        <td className="px-6 py-4 font-medium text-ink">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sand text-ink/70 text-xs font-bold shrink-0">
                              <User size={13} />
                            </div>
                            <div>
                              <span className="font-semibold block">{appt.patientName}</span>
                              <span className="text-[10px] text-ink/50">ID #{appt.patientId}</span>
                            </div>
                          </div>
                        </td>

                        {/* Doctor */}
                        <td className="px-6 py-4 font-medium text-ink">
                          <span className="font-semibold block">Dr. {appt.doctorName}</span>
                          <span className="text-[11px] text-ink/55 font-normal">
                            {appt.doctorSpecialty}
                          </span>
                        </td>

                        {/* Reason */}
                        <td className="px-6 py-4 text-ink/65 max-w-xs truncate">
                          {appt.reason || 'Routine consultation'}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusChip status={appt.status} />
                        </td>

                        {/* Desk Actions */}
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          {isBooked ? (
                            <div className="flex items-center justify-end gap-2">
                              {/* No-Show Action (allowed on today or past) */}
                              {!isFuture && (
                                <button
                                  onClick={() =>
                                    setActionTarget({ type: 'NO_SHOW', appt })
                                  }
                                  className="text-xs font-medium text-ink/60 hover:text-ink hover:underline cursor-pointer"
                                >
                                  Mark No-Show
                                </button>
                              )}

                              {/* Cancel Action */}
                              <button
                                onClick={() =>
                                  setActionTarget({ type: 'CANCEL', appt })
                                }
                                className="text-xs font-semibold text-brick hover:underline cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-ink/40">
                              {appt.status === 'CLINIC_CANCELLED'
                                ? 'Clinic Cancelled'
                                : appt.status === 'CANCELLED'
                                ? 'Cancelled'
                                : 'Concluded'}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 4. Action Confirmation Modal */}
      <Modal
        isOpen={!!actionTarget}
        onClose={() => setActionTarget(null)}
        title={
          actionTarget?.type === 'NO_SHOW'
            ? 'Mark Patient as No-Show'
            : 'Cancel Appointment'
        }
      >
        {actionTarget && (
          <div className="space-y-4">
            <p className="text-sm text-ink/80">
              {actionTarget.type === 'NO_SHOW' ? (
                <>
                  Confirm marking <strong>{actionTarget.appt.patientName}</strong> as absent /
                  no-show for their consultation with{' '}
                  <strong>Dr. {actionTarget.appt.doctorName}</strong> on{' '}
                  <strong>{selectedDate}</strong>?
                </>
              ) : (
                <>
                  Are you sure you want to cancel the booking for{' '}
                  <strong>{actionTarget.appt.patientName}</strong> with{' '}
                  <strong>Dr. {actionTarget.appt.doctorName}</strong> on{' '}
                  <strong>{selectedDate}</strong>?
                </>
              )}
            </p>

            {actionError && (
              <div className="flex items-center gap-2 rounded-xl bg-brick/10 p-3 text-xs text-brick font-medium">
                <AlertCircle size={16} />
                <span>{actionError}</span>
              </div>
            )}

            {actionSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-[#FDEBB8] p-3 text-xs text-[#5C3E08]">
                <CheckCircle2 size={16} />
                <span>{actionSuccess}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-ink/10">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActionTarget(null)}
              >
                Go Back
              </Button>
              <Button
                variant={actionTarget.type === 'NO_SHOW' ? 'secondary' : 'danger'}
                size="sm"
                disabled={actionLoading}
                loading={actionLoading}
                onClick={handleConfirmAction}
              >
                {actionTarget.type === 'NO_SHOW'
                  ? 'Confirm No-Show'
                  : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
