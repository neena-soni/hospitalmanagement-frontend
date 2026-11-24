import { useEffect, useState } from 'react'
import {
  Stethoscope,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Filter,
  User,
  PlusCircle,
} from 'lucide-react'
import { getDoctors, getSpecialties, getDoctorCapacity, getBatchDoctorCapacity } from '../../api/doctors'
import { bookAppointment } from '../../api/appointments'
import { getAllPatients, createPatient } from '../../api/patients'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import StatusChip from '../../components/ui/StatusChip'

export default function DoctorDiscovery({
  onNavigateToAppointments,
  initialSpecialty = '',
  patients = [],
  selectedPatientId = '',
  onSelectPatientId,
  onPatientCreated,
}) {
  const [doctors, setDoctors] = useState([])
  const [specialties, setSpecialties] = useState([])
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty)

  // Sync if initialSpecialty changes from AI routing
  useEffect(() => {
    if (initialSpecialty) {
      setSelectedSpecialty(initialSpecialty)
    }
  }, [initialSpecialty])
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split('T')[0]
  )
  const [capacities, setCapacities] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Internal fallback if not passed from parent
  const [localPatients, setLocalPatients] = useState([])
  const [localPatientId, setLocalPatientId] = useState('')

  const activePatients = patients.length > 0 ? patients : localPatients
  const activeSelectedId = selectedPatientId || localPatientId
  const handleSelectId = onSelectPatientId || setLocalPatientId

  // Find currently selected patient object for display
  const activePatientObj = activePatients.find((p) => String(p.id) === String(activeSelectedId))

  // Quick Register Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [regForm, setRegForm] = useState({
    name: '',
    dateOfBirth: '',
    age: '',
    gender: 'MALE',
    phoneNumber: '',
    email: '',
    medicalHistory: '',
  })
  const [regError, setRegError] = useState('')
  const [regLoading, setRegLoading] = useState(false)

  // Auto-calculate age whenever dateOfBirth is changed
  const handleDobChange = (dob) => {
    let calculatedAge = regForm.age
    if (dob) {
      const birthDate = new Date(dob)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const m = today.getMonth() - birthDate.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      calculatedAge = age >= 0 ? String(age) : ''
    }
    setRegForm((prev) => ({
      ...prev,
      dateOfBirth: dob,
      age: calculatedAge,
    }))
  }

  // Booking Modal State
  const [bookingDoctor, setBookingDoctor] = useState(null)
  const [reason, setReason] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState('')

  // 1. Load specialties & existing patients on mount
  useEffect(() => {
    getSpecialties()
      .then(setSpecialties)
      .catch((err) => console.error('Could not load specialties:', err))

    if (patients.length === 0) {
      loadPatients()
    }
  }, [patients.length])

  const loadPatients = () => {
    getAllPatients()
      .then((data) => {
        setLocalPatients(data)
        if (data.length > 0 && !activeSelectedId) {
          handleSelectId(String(data[0].id))
        }
      })
      .catch((err) => console.error('Could not load patients:', err))
  }

  // 2. Load doctors whenever selected specialty changes
  useEffect(() => {
    setLoading(true)
    setError('')
    const params = selectedSpecialty ? { specialty: selectedSpecialty } : {}

    getDoctors(params)
      .then((data) => {
        setDoctors(data)
        loadCapacities(data, selectedDate)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [selectedSpecialty, selectedDate])

  // Helper: Query capacity for all doctors on selectedDate in ONE single call
  const loadCapacities = async (docList, date) => {
    try {
      // Use the fast single-request batch capacity endpoint
      const batchResults = await getBatchDoctorCapacity(date)
      setCapacities(batchResults || {})
    } catch (err) {
      console.warn('Batch capacity endpoint error, falling back to individual calls:', err)
      // Fallback: Individual calls if needed
      const results = {}
      await Promise.all(
        docList.map(async (doc) => {
          try {
            results[doc.id] = await getDoctorCapacity(doc.id, date)
          } catch {
            results[doc.id] = null
          }
        })
      )
      setCapacities(results)
    }
  }

  // Handle Quick Patient Registration
  const handleRegisterPatient = async (e) => {
    e.preventDefault()
    if (regLoading) return // Prevent double-click submission

    setRegLoading(true)
    setRegError('')

    try {
      const newPatient = await createPatient({
        name: regForm.name.trim(),
        dateOfBirth: regForm.dateOfBirth || null,
        age: regForm.age ? Number(regForm.age) : null,
        gender: regForm.gender,
        phoneNumber: regForm.phoneNumber.trim(),
        email: regForm.email ? regForm.email.trim() : null,
        medicalHistory: regForm.medicalHistory.trim() || null,
      })

      // Add to patient list and set as currently selected
      if (onPatientCreated) {
        onPatientCreated(newPatient)
      } else {
        setLocalPatients((prev) => [...prev, newPatient])
        handleSelectId(String(newPatient.id))
      }
      setIsRegisterOpen(false)
      setRegForm({
        name: '',
        dateOfBirth: '',
        age: '',
        gender: 'MALE',
        phoneNumber: '',
        email: '',
        medicalHistory: '',
      })
    } catch (err) {
      setRegError(err.message)
    } finally {
      setRegLoading(false)
    }
  }

  // Handle Booking Submission
  const handleBook = async (e) => {
    e.preventDefault()
    if (bookingLoading) return // Prevent double-click submission

    if (!activeSelectedId) {
      setBookingError('Please select or register a patient first')
      return
    }

    setBookingLoading(true)
    setBookingError('')
    setBookingSuccess('')

    try {
      await bookAppointment({
        patientId: Number(activeSelectedId),
        doctorId: bookingDoctor.id,
        appointmentDate: selectedDate,
        reason: reason.trim(),
      })
      setBookingSuccess('Appointment successfully booked!')

      // Immediately refresh capacity for this doctor on the selected date
      const updatedCap = await getDoctorCapacity(bookingDoctor.id, selectedDate)
      setCapacities((prev) => ({ ...prev, [bookingDoctor.id]: updatedCap }))

      setTimeout(() => {
        setBookingDoctor(null)
        setReason('')
        setBookingSuccess('')
      }, 1400)
    } catch (err) {
      setBookingError(err.message)
    } finally {
      setBookingLoading(false)
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

  const selectedDayOfWeek = getSelectedDayOfWeek(selectedDate)

  const displayedDoctors = doctors

  return (
    <div className="space-y-8">
      {/* Top Banner: Greeting & Active Patient Selector */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-clay">
            Patient Portal
          </span>
          <h2 className="mt-1 font-display text-3xl text-ink md:text-4xl">
            Hi, {activePatients.find((p) => String(p.id) === String(activeSelectedId))?.name || 'Patient'}! Welcome Back
          </h2>
          <p className="mt-1 text-sm text-ink/60">
            Browse available doctors, check daily capacity, and secure your consultation.
          </p>
        </div>

        {/* Patient Switcher & Register Button */}
        <div className="flex items-center gap-2">
          {activePatients.length > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-sand/80 px-3.5 py-1.5 border border-ink/10 shadow-xs">
              <User size={15} className="text-clay" />
              <select
                value={activeSelectedId}
                onChange={(e) => handleSelectId(e.target.value)}
                className="bg-transparent text-xs font-medium text-ink focus:outline-none cursor-pointer"
              >
                {activePatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (#{p.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsRegisterOpen(true)}
          >
            <PlusCircle size={14} className="text-clay" />
            <span>New Patient</span>
          </Button>
        </div>
      </div>

      {/* Date & Specialty Filter Card */}
      <Card className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* Date Selector */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-clay/15 text-clay">
              <Calendar size={18} />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink/60">
                Consultation Date
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-0.5 rounded-full border border-ink/15 bg-sand/50 px-4 py-1.5 text-sm font-medium text-ink focus:border-clay focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Specialty Filter Dropdown Menu */}
        <div className="flex items-center gap-2">
          <label htmlFor="specialty-filter" className="flex items-center gap-1.5 text-xs font-medium text-ink/70">
            <Filter size={14} className="text-clay" /> Specialty:
          </label>
          <select
            id="specialty-filter"
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="rounded-full border border-ink/15 bg-sand/40 px-3.5 py-1.5 text-xs font-semibold text-ink focus:border-clay focus:outline-none cursor-pointer"
          >
            <option value="">All Specialties</option>
            {specialties.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Loading & Error States */}
      {loading && (
        <Card className="text-center py-12">
          <p className="text-ink/60">Finding available doctors and checking capacities…</p>
        </Card>
      )}

      {error && (
        <Card className="border-brick/30 bg-brick/5 text-center py-8">
          <p className="text-brick font-medium">{error}</p>
        </Card>
      )}

      {/* Doctors Cards Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {displayedDoctors.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-ink/50">
              No doctors found matching this criteria.
            </div>
          ) : (
            displayedDoctors.map((doctor) => {
              const cap = capacities[doctor.id]
              const canBook = cap ? cap.canBook : doctor.available
              const spotsMessage = cap ? cap.message : 'Checking spots…'

              // Dynamically derived status relative to the selected consultation date
              const isWorkingOnSelectedDate =
                !doctor.availableDays ||
                doctor.availableDays.length === 0 ||
                doctor.availableDays.includes(selectedDayOfWeek)

              const effectiveStatus = !doctor.available
                ? 'On Leave'
                : !isWorkingOnSelectedDate
                ? 'Off-Duty Today'
                : cap && !cap.canBook && cap.remaining === 0
                ? 'Fully Booked'
                : cap?.canBook
                ? 'Available'
                : 'Available'

              const statusBadgeClass =
                effectiveStatus === 'Available'
                  ? 'bg-[#FDEBB8] text-[#5C3E08] border border-[#DCA23A]'
                  : effectiveStatus === 'Fully Booked' || effectiveStatus === 'On Leave'
                  ? 'bg-[#FAD9D0] text-[#8C2310] border border-[#DE7864]'
                  : 'bg-[#EAE4DC] text-[#38312B] border border-[#B8AEA3]'

              return (
                <Card
                  key={doctor.id}
                  className="flex flex-col justify-between transition-all duration-200 hover:shadow-md"
                >
                  <div>
                    {/* Header: Avatar, Name, Specialty, Availability */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clay text-canvas shadow-soft">
                          <Stethoscope size={22} />
                        </div>
                        <div>
                          <h3 className="font-display text-xl text-ink leading-tight">
                            {doctor.name}
                          </h3>
                          <span className="text-xs font-medium text-clay">
                            {doctor.specialty}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass}`}
                      >
                        {effectiveStatus}
                      </span>
                    </div>

                    {/* Schedule & Fee Details */}
                    <div className="mt-5 space-y-2 rounded-2xl bg-sand/40 p-4 text-xs text-ink/70">
                      {doctor.shiftStartTime && doctor.shiftEndTime && (
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-ink/40" />
                          <span>
                            Shift: {doctor.shiftStartTime} – {doctor.shiftEndTime}
                          </span>
                        </div>
                      )}
                      {doctor.consultationFee != null && (
                        <div className="flex items-center gap-2">
                          <DollarSign size={14} className="text-ink/40" />
                          <span className="font-medium text-ink">
                            Fee: ${doctor.consultationFee.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {doctor.availableDays && doctor.availableDays.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-ink/40" />
                          <span>
                            Days: {doctor.availableDays.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer: Spots-Left Badge & Book Action */}
                  <div className="mt-6 pt-4 border-t border-ink/10 flex items-center justify-between">
                    <div>
                      <span className="block text-[11px] uppercase tracking-wider text-ink/50">
                        Date Capacity
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          canBook ? 'text-brass font-bold' : 'text-brick'
                        }`}
                      >
                        {spotsMessage}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      disabled={!canBook}
                      onClick={() => setBookingDoctor(doctor)}
                    >
                      Book Slot
                    </Button>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* 1. Quick Patient Registration Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register New Patient"
      >
        <form onSubmit={handleRegisterPatient} className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={regForm.name}
              onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
              placeholder="e.g. Eleanor Vance"
              className="mt-1 w-full rounded-full border border-ink/15 bg-sand/30 px-4 py-2 text-sm text-ink focus:border-clay focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                Date of Birth
              </label>
              <input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={regForm.dateOfBirth}
                onChange={(e) => handleDobChange(e.target.value)}
                className="mt-1 w-full rounded-full border border-ink/15 bg-sand/30 px-4 py-2 text-sm text-ink focus:border-clay focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                Age
              </label>
              <input
                type="number"
                min="0"
                max="150"
                value={regForm.age}
                onChange={(e) => setRegForm({ ...regForm, age: e.target.value })}
                placeholder="e.g. 32"
                className="mt-1 w-full rounded-full border border-ink/15 bg-sand/30 px-4 py-2 text-sm text-ink focus:border-clay focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
              Gender
            </label>
            <select
              value={regForm.gender}
              onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
              className="mt-1 w-full rounded-full border border-ink/15 bg-sand/30 px-4 py-2 text-sm text-ink focus:border-clay focus:outline-none cursor-pointer"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
              Phone Number (Unique) *
            </label>
            <input
              type="tel"
              required
              value={regForm.phoneNumber}
              onChange={(e) => setRegForm({ ...regForm, phoneNumber: e.target.value })}
              placeholder="e.g. +1 555-0192"
              className="mt-1 w-full rounded-full border border-ink/15 bg-sand/30 px-4 py-2 text-sm text-ink focus:border-clay focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
              Email Address
            </label>
            <input
              type="email"
              value={regForm.email}
              onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
              placeholder="e.g. eleanor@example.com"
              className="mt-1 w-full rounded-full border border-ink/15 bg-sand/30 px-4 py-2 text-sm text-ink focus:border-clay focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
              Medical History / Notes
            </label>
            <textarea
              rows={2}
              value={regForm.medicalHistory}
              onChange={(e) => setRegForm({ ...regForm, medicalHistory: e.target.value })}
              placeholder="Any pre-existing conditions, allergies..."
              className="mt-1 w-full rounded-2xl border border-ink/15 bg-sand/30 p-3 text-sm text-ink focus:border-clay focus:outline-none"
            />
          </div>

          {regError && (
            <div className="flex items-center gap-2 rounded-xl bg-brick/10 p-3 text-xs text-brick">
              <AlertCircle size={16} />
              <span>{regError}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={() => setIsRegisterOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={regLoading}
              loading={regLoading}
            >
              {regLoading ? 'Registering…' : 'Register Patient'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Book Appointment Modal */}
      <Modal
        isOpen={!!bookingDoctor}
        onClose={() => setBookingDoctor(null)}
        title={`Book Appointment`}
      >
        {bookingDoctor && (
          <form onSubmit={handleBook} className="space-y-4">
            <div className="rounded-2xl bg-sand/40 p-4 text-sm text-ink/80 space-y-1">
              <p>
                <strong>Doctor:</strong> {bookingDoctor.name} ({bookingDoctor.specialty})
              </p>
              <p>
                <strong>Appointment Date:</strong> {selectedDate}
              </p>
              {bookingDoctor.consultationFee != null && (
                <p>
                  <strong>Consultation Fee:</strong> ${bookingDoctor.consultationFee.toFixed(2)}
                </p>
              )}
              {bookingDoctor.shiftStartTime && bookingDoctor.shiftEndTime && (
                <p className="text-xs text-ink/60">
                  Shift: {bookingDoctor.shiftStartTime} – {bookingDoctor.shiftEndTime}
                </p>
              )}
            </div>

            {/* Patient Display (Selected in outer workspace dropdown) */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                Booking For Patient
              </label>

              {activePatientObj ? (
                <div className="mt-1 rounded-2xl border border-ink/10 bg-sand/30 p-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm text-ink block">{activePatientObj.name}</span>
                    <span className="text-xs text-ink/60">Phone: {activePatientObj.phoneNumber}</span>
                  </div>
                  <span className="text-xs font-medium bg-forest/10 text-forest px-2.5 py-0.5 rounded-full">
                    Active Patient
                  </span>
                </div>
              ) : (
                <div className="mt-1 p-3 rounded-2xl border border-brick/20 bg-brick/10 text-xs text-brick">
                  No patient selected. Please select a patient from the patient workspace selector.
                </div>
              )}
            </div>

            {/* Reason Input */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                Reason for Consultation *
              </label>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe symptoms or purpose (e.g. recurring migraines, blood pressure review...)"
                className="mt-1 w-full rounded-2xl border border-ink/15 bg-sand/30 p-3 text-sm text-ink focus:border-clay focus:outline-none"
              />
            </div>

            {bookingError && (
              <div className="flex items-center gap-2 rounded-xl bg-brick/10 p-3 text-xs text-brick">
                <AlertCircle size={16} />
                <span>{bookingError}</span>
              </div>
            )}

            {bookingSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-[#FDEBB8] p-3 text-xs text-[#5C3E08]">
                <CheckCircle2 size={16} />
                <span>{bookingSuccess}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                type="button"
                onClick={() => setBookingDoctor(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                disabled={bookingLoading || !activeSelectedId}
                loading={bookingLoading}
              >
                {bookingLoading ? 'Booking…' : 'Confirm Appointment'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
