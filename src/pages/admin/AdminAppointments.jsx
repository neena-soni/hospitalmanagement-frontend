import { useEffect, useState } from 'react'
import {
  Calendar,
  Filter,
  Search,
  User,
  Stethoscope,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import {
  getAllAppointments,
  cancelAppointment,
  emergencyCancelDoctorDate,
  markNoShow,
} from '../../api/appointments'
import { getDoctors } from '../../api/doctors'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import StatusChip from '../../components/ui/StatusChip'
import Modal from '../../components/ui/Modal'

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL, BOOKED, CANCELLED, NO_SHOW
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  // Action Confirmation Modal (Single Appointment Cancel / No-Show)
  const [actionTarget, setActionTarget] = useState(null) // { type: 'CANCEL' | 'NO_SHOW', appt }
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Emergency Doctor Day Cancellation State (Admin Only - Option A)
  // Note: When a doctor calls in sick or goes on emergency leave, Admin can cancel
  // all of that doctor's booked appointments for that day in one go.
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false)
  const [doctors, setDoctors] = useState([])
  const [emergencyDocId, setEmergencyDocId] = useState('')
  const [emergencyDate, setEmergencyDate] = useState(
    () => new Date().toISOString().split('T')[0]
  )
  const [emergencyLoading, setEmergencyLoading] = useState(false)
  const [emergencyError, setEmergencyError] = useState('')

  useEffect(() => {
    loadAppointments()
    getDoctors()
      .then((docs) => {
        setDoctors(docs)
        if (docs.length > 0) setEmergencyDocId(docs[0].id)
      })
      .catch((err) => console.error('Could not load doctors:', err))
  }, [])

  const loadAppointments = () => {
    setLoading(true)
    setError('')
    getAllAppointments()
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
      if (actionTarget.type === 'NO_SHOW') {
        await markNoShow(actionTarget.appt.id)
        showSuccess('Appointment marked as No-Show.')
      } else {
        await cancelAppointment(actionTarget.appt.id)
        showSuccess('Appointment successfully cancelled.')
      }
      setActionTarget(null)
      loadAppointments()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Admin Emergency Clinic Cancellation submission
  const handleConfirmEmergencyCancel = async (e) => {
    e.preventDefault()
    if (!emergencyDocId || !emergencyDate || emergencyLoading) return

    setEmergencyLoading(true)
    setEmergencyError('')

    try {
      const cancelledList = await emergencyCancelDoctorDate(
        emergencyDocId,
        emergencyDate
      )
      showSuccess(
        `Emergency clinic cancellation completed: ${cancelledList.length} appointment(s) marked as Clinic Cancelled.`
      )
      setIsEmergencyModalOpen(false)
      loadAppointments()
    } catch (err) {
      setEmergencyError(err.message)
    } finally {
      setEmergencyLoading(false)
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]

  // Filter appointments
  const filtered = appointments.filter((a) => {
    // Status filter
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false

    // Date filter
    if (dateFilter && a.appointmentDate !== dateFilter) return false

    // Text search (patient name, doctor name, reason)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchPatient = a.patientName?.toLowerCase().includes(q)
      const matchDoctor = a.doctorName?.toLowerCase().includes(q)
      const matchReason = a.reason?.toLowerCase().includes(q)
      if (!matchPatient && !matchDoctor && !matchReason) return false
    }

    return true
  })

  // Metric counts
  const totalCount = appointments.length
  const bookedCount = appointments.filter((a) => a.status === 'BOOKED').length
  const cancelledCount = appointments.filter((a) => a.status === 'CANCELLED').length
  const noShowCount = appointments.filter((a) => a.status === 'NO_SHOW').length

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-clay">
            Hospital Administration
          </span>
          <h2 className="mt-1 font-display text-3xl text-ink md:text-4xl">
            Master Hospital Appointments
          </h2>
          <p className="mt-1 text-sm text-ink/60">
            Complete audit log of all clinical bookings, cancellations, and attendance across departments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Emergency Clinic Cancel Button (Admin Only - Option A) */}
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setEmergencyError('')
              setIsEmergencyModalOpen(true)
            }}
          >
            <AlertTriangle size={13} />
            <span>Emergency Clinic Cancel</span>
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-2xl bg-[#FDEBB8] p-3.5 text-xs text-[#5C3E08] border border-[#DCA23A] shadow-soft">
          <CheckCircle2 size={16} className="text-[#957445]" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* 2. Metrics Bar */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="p-4 text-center">
          <span className="text-[11px] font-medium uppercase tracking-wider text-ink/50">
            Total Bookings
          </span>
          <div className="mt-1 font-display text-2xl font-bold text-ink">
            {totalCount}
          </div>
        </Card>

        <Card className="p-4 text-center">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#5C3E08]">
            Active Booked
          </span>
          <div className="mt-1 font-display text-2xl font-bold text-[#5C3E08]">
            {bookedCount}
          </div>
        </Card>

        <Card className="p-4 text-center">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#8C2310]">
            Cancelled
          </span>
          <div className="mt-1 font-display text-2xl font-bold text-[#8C2310]">
            {cancelledCount}
          </div>
        </Card>

        <Card className="p-4 text-center">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#38312B]">
            No-Show
          </span>
          <div className="mt-1 font-display text-2xl font-bold text-[#38312B]">
            {noShowCount}
          </div>
        </Card>
      </div>

      {/* 3. Controls & Filter Bar */}
      <Card className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 rounded-full bg-sand/60 p-1 border border-ink/10">
            {['ALL', 'BOOKED', 'CANCELLED', 'CLINIC_CANCELLED', 'NO_SHOW'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer select-none ${
                  statusFilter === st
                    ? 'bg-clay text-canvas shadow-xs'
                    : 'text-ink/65 hover:text-ink'
                }`}
              >
                {st === 'ALL'
                  ? 'All'
                  : st === 'BOOKED'
                  ? 'Booked'
                  : st === 'CANCELLED'
                  ? 'Cancelled'
                  : st === 'CLINIC_CANCELLED'
                  ? 'Clinic Cancelled'
                  : 'No-Show'}
              </button>
            ))}
          </div>

          {/* Date Picker Filter */}
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-clay" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-full border border-ink/15 bg-sand/40 px-3 py-1 text-xs font-medium text-ink focus:border-clay focus:outline-none"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs text-ink/50 hover:text-ink cursor-pointer underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Text Search */}
        <div className="relative max-w-xs w-full">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient or doctor..."
            className="w-full rounded-full border border-ink/15 bg-sand/30 pl-9 pr-3 py-1.5 text-xs text-ink focus:border-clay focus:outline-none"
          />
        </div>
      </Card>

      {/* Loading & Error States */}
      {loading && (
        <Card className="text-center py-12">
          <p className="text-ink/60">Loading hospital appointments…</p>
        </Card>
      )}

      {error && (
        <Card className="border-brick/30 bg-brick/5 text-center py-8">
          <p className="text-brick font-medium">{error}</p>
        </Card>
      )}

      {/* 4. Appointments Table */}
      {!loading && !error && (
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sand/60 text-ink/70 uppercase tracking-wider text-[11px] font-semibold border-b border-ink/10">
                <tr>
                  <th className="px-6 py-4">ID / Date</th>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Physician</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-ink/50">
                      No matching hospital appointment records found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((appt) => {
                    const isFuture = appt.appointmentDate > todayStr
                    const isBooked = appt.status === 'BOOKED'

                    return (
                      <tr key={appt.id} className="hover:bg-sand/30 transition-colors">
                        {/* ID / Date */}
                        <td className="px-6 py-4 font-semibold text-ink whitespace-nowrap">
                          <div>#{appt.id}</div>
                          <div className="text-[11px] text-ink/60 font-normal">
                            {appt.appointmentDate}
                          </div>
                        </td>

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
                          {appt.reason || 'General checkup'}
                        </td>

                        {/* Status Chip */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusChip status={appt.status} />
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          {isBooked ? (
                            <div className="flex items-center justify-end gap-2">
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
                              {appt.status === 'CANCELLED' ? 'Cancelled' : 'Concluded'}
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

      {/* 5. Action Confirmation Modal */}
      <Modal
        isOpen={!!actionTarget}
        onClose={() => setActionTarget(null)}
        title={
          actionTarget?.type === 'NO_SHOW'
            ? 'Mark Appointment as No-Show'
            : 'Cancel Patient Appointment'
        }
      >
        {actionTarget && (
          <div className="space-y-4">
            <p className="text-sm text-ink/80">
              {actionTarget.type === 'NO_SHOW' ? (
                <>
                  Confirm recording no-show status for{' '}
                  <strong>{actionTarget.appt.patientName}</strong> (Doctor:{' '}
                  <strong>Dr. {actionTarget.appt.doctorName}</strong> on{' '}
                  <strong>{actionTarget.appt.appointmentDate}</strong>)?
                </>
              ) : (
                <>
                  Are you sure you want to cancel the booking for{' '}
                  <strong>{actionTarget.appt.patientName}</strong> with{' '}
                  <strong>Dr. {actionTarget.appt.doctorName}</strong> on{' '}
                  <strong>{actionTarget.appt.appointmentDate}</strong>?
                </>
              )}
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

      {/* 5. Emergency Doctor Clinic Cancellation Modal (Admin Only - Option A) */}
      <Modal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        title="Emergency Doctor Clinic Cancellation"
      >
        <form onSubmit={handleConfirmEmergencyCancel} className="space-y-4">
          <p className="text-xs text-ink/70">
            Use this administrative action when a doctor is on emergency leave or sick.
            All active bookings for this doctor on the selected date will be cancelled in one batch,
            and patients will see the cancellation reason in their portal.
          </p>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
              Select Physician *
            </label>
            <select
              required
              value={emergencyDocId}
              onChange={(e) => setEmergencyDocId(e.target.value)}
              className="mt-1 w-full rounded-full border border-ink/15 bg-sand/30 px-3.5 py-2 text-xs text-ink focus:border-clay focus:outline-none"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.name} ({d.specialty}) {d.available ? '' : '[On Leave]'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
              Clinic Date to Cancel *
            </label>
            <input
              type="date"
              required
              value={emergencyDate}
              onChange={(e) => setEmergencyDate(e.target.value)}
              className="mt-1 w-full rounded-full border border-ink/15 bg-sand/30 px-3.5 py-2 text-xs text-ink focus:border-clay focus:outline-none"
            />
          </div>

          <div className="rounded-xl bg-sand/50 p-3.5 border border-ink/10 text-xs text-ink/75 space-y-1">
            <p className="font-semibold text-ink">Zero Medical Data Loss:</p>
            <p>
              This updates the appointment status to <strong>CLINIC CANCELLED</strong>.
              The patient&apos;s original medical visit reason is preserved 100% intact and will not be overwritten.
            </p>
          </div>

          {emergencyError && (
            <div className="flex items-center gap-2 rounded-xl bg-brick/10 p-3 text-xs text-brick">
              <AlertCircle size={16} />
              <span>{emergencyError}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-ink/5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsEmergencyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              disabled={emergencyLoading}
              loading={emergencyLoading}
            >
              {emergencyLoading
                ? 'Cancelling Clinic…'
                : 'Confirm Emergency Cancellation'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
