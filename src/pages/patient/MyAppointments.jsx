import { useEffect, useState } from 'react'
import {
  Calendar,
  Clock,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react'
import {
  getAppointmentsByPatient,
  cancelAppointment,
} from '../../api/appointments'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import StatusChip from '../../components/ui/StatusChip'
import Modal from '../../components/ui/Modal'

export default function MyAppointments({ patientId, onFindDoctors }) {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('upcoming') // 'upcoming' or 'past'

  // Cancel Confirmation State
  const [cancellingAppt, setCancellingAppt] = useState(null)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [cancelSuccess, setCancelSuccess] = useState('')

  // Load appointments whenever patientId changes
  useEffect(() => {
    if (!patientId) {
      setLoading(false)
      return
    }
    loadAppointments()
  }, [patientId])

  const loadAppointments = () => {
    setLoading(true)
    setError('')
    getAppointmentsByPatient(patientId)
      .then(setAppointments)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  // Handle Cancel Submission
  const handleConfirmCancel = async () => {
    if (!cancellingAppt || cancelLoading) return // Prevent double-click submission

    setCancelLoading(true)
    setCancelError('')
    setCancelSuccess('')

    try {
      await cancelAppointment(cancellingAppt.id)
      setCancelSuccess('Appointment was successfully cancelled.')
      // Refresh list
      loadAppointments()
      setTimeout(() => {
        setCancellingAppt(null)
        setCancelSuccess('')
      }, 1200)
    } catch (err) {
      setCancelError(err.message)
    } finally {
      setCancelLoading(false)
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]

  // Filter Upcoming vs Past
  const upcomingList = appointments.filter(
    (a) => a.appointmentDate >= todayStr && a.status === 'BOOKED'
  )
  const pastList = appointments.filter(
    (a) => a.appointmentDate < todayStr || a.status !== 'BOOKED'
  )

  // Find the earliest upcoming booked appointment to pin at the top
  const nextAppointment = upcomingList.length > 0 ? upcomingList[upcomingList.length - 1] : null

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-widest text-clay">
          Patient Portal
        </span>
        <h2 className="mt-1 font-display text-3xl text-ink md:text-4xl">
          My Appointments
        </h2>
        <p className="mt-1 text-sm text-ink/60">
          Review your scheduled consultations, history, and manage cancellations.
        </p>
      </div>

      {/* 2. Hero Card: Next Upcoming Appointment */}
      {nextAppointment && (
        <Card className="border-l-4 border-l-clay bg-canvas shadow-soft">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clay text-canvas shadow-soft shrink-0">
                <Calendar size={22} />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-clay">
                  Next Upcoming Consultation
                </span>
                <h3 className="font-display text-2xl text-ink">
                  Dr. {nextAppointment.doctorName}
                </h3>
                <p className="text-xs text-ink/60 font-medium">
                  {nextAppointment.doctorSpecialty}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink/70">
                  <span className="flex items-center gap-1 font-semibold text-ink">
                    <Calendar size={13} className="text-clay" />
                    {nextAppointment.appointmentDate}
                  </span>
                  {nextAppointment.reason && (
                    <span className="italic text-ink/60">
                      "{nextAppointment.reason}"
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-center">
              <StatusChip status={nextAppointment.status} />
              <Button
                variant="danger"
                size="sm"
                onClick={() => setCancellingAppt(nextAppointment)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 3. Tab Switcher: Upcoming vs Past History */}
      <div className="flex items-center gap-2 border-b border-ink/10 pb-2">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold transition cursor-pointer select-none ${
            activeTab === 'upcoming'
              ? 'bg-clay text-canvas shadow-xs'
              : 'bg-sand/60 text-ink/70 hover:bg-sand hover:text-ink'
          }`}
        >
          <span>Upcoming</span>
          <span className="rounded-full bg-canvas/30 px-2 py-0.5 text-[10px]">
            {upcomingList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('past')}
          className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold transition cursor-pointer select-none ${
            activeTab === 'past'
              ? 'bg-clay text-canvas shadow-xs'
              : 'bg-sand/60 text-ink/70 hover:bg-sand hover:text-ink'
          }`}
        >
          <span>History & Past</span>
          <span className="rounded-full bg-canvas/30 px-2 py-0.5 text-[10px]">
            {pastList.length}
          </span>
        </button>
      </div>

      {/* 4. Loading & Error States */}
      {loading && (
        <Card className="text-center py-12">
          <p className="text-ink/60">Loading your appointments…</p>
        </Card>
      )}

      {error && (
        <Card className="border-brick/30 bg-brick/5 text-center py-8">
          <p className="text-brick font-medium">{error}</p>
        </Card>
      )}

      {/* 5. Appointments List Table / Rows */}
      {!loading && !error && (
        <>
          {(activeTab === 'upcoming' ? upcomingList : pastList).length === 0 ? (
            <Card className="text-center py-14">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sand text-ink/40">
                <Calendar size={26} />
              </div>
              <h4 className="mt-4 font-display text-xl text-ink">
                {activeTab === 'upcoming'
                  ? 'No upcoming appointments scheduled'
                  : 'No past appointment history'}
              </h4>
              <p className="mt-1 text-xs text-ink/60 max-w-sm mx-auto">
                {activeTab === 'upcoming'
                  ? 'Ready to see a specialist? Browse our roster of available doctors.'
                  : 'Your past consultations and cancellations will appear here.'}
              </p>
              {activeTab === 'upcoming' && (
                <div className="mt-6">
                  <Button variant="primary" size="md" onClick={onFindDoctors}>
                    <span>Find Doctors</span>
                    <ArrowRight size={14} />
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            <Card padded={false} className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  {/* Pale Header Band (Reference 3 style) */}
                  <thead className="bg-sand/60 text-ink/70 uppercase tracking-wider text-[11px] font-semibold border-b border-ink/10">
                    <tr>
                      <th className="px-6 py-4">Doctor</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Reason</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {(activeTab === 'upcoming' ? upcomingList : pastList).map(
                      (appt) => (
                        <tr
                          key={appt.id}
                          className="hover:bg-sand/30 transition-colors"
                        >
                          {/* Doctor Name with Stethoscope Avatar & Specialty Subtitle */}
                          <td className="px-6 py-4 font-medium text-ink">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-clay/15 text-clay shrink-0">
                                <Stethoscope size={15} />
                              </div>
                              <div>
                                <span className="font-semibold block text-ink">
                                  Dr. {appt.doctorName}
                                </span>
                                <span className="text-[11px] text-ink/55 font-normal">
                                  {appt.doctorSpecialty}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Date */}
                          <td className="px-6 py-4 text-ink font-semibold whitespace-nowrap">
                            {appt.appointmentDate}
                          </td>

                          {/* Reason */}
                          <td className="px-6 py-4 text-ink/65 max-w-xs truncate">
                            {appt.reason || 'Routine consultation'}
                          </td>

                          {/* Status Badge */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusChip status={appt.status} />
                          </td>

                          {/* Action: Cancel only allowed on active BOOKED appointments today or in future */}
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            {appt.status === 'BOOKED' && appt.appointmentDate >= todayStr ? (
                              <button
                                onClick={() => setCancellingAppt(appt)}
                                className="text-xs font-semibold text-brick hover:underline cursor-pointer"
                              >
                                Cancel
                              </button>
                            ) : (
                              <span className="text-[11px] text-ink/40 font-medium select-none">
                                {appt.status === 'CLINIC_CANCELLED'
                                  ? 'Doctor on Leave'
                                  : appt.appointmentDate < todayStr
                                  ? 'Past Visit'
                                  : appt.status === 'CANCELLED'
                                  ? 'Cancelled'
                                  : 'Concluded'}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* 6. Cancel Confirmation Modal */}
      <Modal
        isOpen={!!cancellingAppt}
        onClose={() => setCancellingAppt(null)}
        title="Cancel Appointment"
      >
        {cancellingAppt && (
          <div className="space-y-4">
            <p className="text-sm text-ink/80">
              Are you sure you want to cancel your consultation with{' '}
              <strong>Dr. {cancellingAppt.doctorName}</strong> on{' '}
              <strong>{cancellingAppt.appointmentDate}</strong>?
            </p>

            <p className="text-xs text-ink/60 bg-sand/40 p-3 rounded-xl">
              This will release your booked slot back to the doctor's daily capacity for other patients.
            </p>

            {cancelError && (
              <div className="flex items-center gap-2 rounded-xl bg-brick/10 p-3 text-xs text-brick">
                <AlertCircle size={16} />
                <span>{cancelError}</span>
              </div>
            )}

            {cancelSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-[#FDEBB8] p-3 text-xs text-[#5C3E08]">
                <CheckCircle2 size={16} />
                <span>{cancelSuccess}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-ink/10">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCancellingAppt(null)}
              >
                Keep Appointment
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={cancelLoading}
                loading={cancelLoading}
                onClick={handleConfirmCancel}
              >
                {cancelLoading ? 'Cancelling…' : 'Yes, Cancel Appointment'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
