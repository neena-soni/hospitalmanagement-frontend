import { useEffect, useState } from 'react'
import {
  Search,
  UserPlus,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { getPatients, getAllPatients, createPatient } from '../../api/patients'
import { getDoctors, getDoctorCapacity } from '../../api/doctors'
import { bookAppointment } from '../../api/appointments'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'

export default function DeskPatients() {
  const [patients, setPatients] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Walk-In Patient Registration State
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
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState('')

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

  // Desk Booking Modal State
  const [bookingPatient, setBookingPatient] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split('T')[0]
  )
  const [selectedDoctorCapacity, setSelectedDoctorCapacity] = useState(null)
  const [bookingReason, setBookingReason] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState('')

  // 1. Initial Load: Load all patients & doctors
  useEffect(() => {
    loadPatients()
    getDoctors()
      .then((docs) => {
        setDoctors(docs)
        if (docs.length > 0) setSelectedDoctorId(String(docs[0].id))
      })
      .catch((err) => console.error('Could not load doctors:', err))
  }, [])

  // 2. Name search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        setLoading(true)
        getPatients(searchQuery.trim())
          .then(setPatients)
          .catch((err) => setError(err.message))
          .finally(() => setLoading(false))
      } else {
        loadPatients()
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const loadPatients = () => {
    setLoading(true)
    setError('')
    getAllPatients()
      .then(setPatients)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  // 3. Whenever selectedDoctorId or selectedDate changes in booking modal, check capacity
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) return
    getDoctorCapacity(Number(selectedDoctorId), selectedDate)
      .then(setSelectedDoctorCapacity)
      .catch(() => setSelectedDoctorCapacity(null))
  }, [selectedDoctorId, selectedDate])

  // Handle Walk-In Patient Registration
  const handleRegisterPatient = async (e) => {
    e.preventDefault()
    if (regLoading) return // Debounce guard

    setRegLoading(true)
    setRegError('')

    try {
      const created = await createPatient({
        name: regForm.name.trim(),
        dateOfBirth: regForm.dateOfBirth || null,
        age: regForm.age ? Number(regForm.age) : null,
        gender: regForm.gender,
        phoneNumber: regForm.phoneNumber.trim(),
        email: regForm.email ? regForm.email.trim() : null,
        medicalHistory: regForm.medicalHistory.trim() || null,
      })

      // Add directly to directory
      setPatients((prev) => [created, ...prev])
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

      // Automatically offer to book for this new patient
      setBookingPatient(created)
    } catch (err) {
      setRegError(err.message)
    } finally {
      setRegLoading(false)
    }
  }

  // Handle Front-Desk Booking Submission
  const handleDeskBook = async (e) => {
    e.preventDefault()
    if (bookingLoading || !bookingPatient || !selectedDoctorId) return

    setBookingLoading(true)
    setBookingError('')
    setBookingSuccess('')

    try {
      await bookAppointment({
        patientId: bookingPatient.id,
        doctorId: Number(selectedDoctorId),
        appointmentDate: selectedDate,
        reason: bookingReason.trim(),
      })
      setBookingSuccess('Appointment confirmed on patient’s behalf!')
      setTimeout(() => {
        setBookingPatient(null)
        setBookingReason('')
        setBookingSuccess('')
      }, 1400)
    } catch (err) {
      setBookingError(err.message)
    } finally {
      setBookingLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-clay">
            Registration Desk
          </span>
          <h2 className="mt-1 font-display text-3xl text-ink md:text-4xl">
            Patient Registry & Walk-Ins
          </h2>
          <p className="mt-1 text-sm text-ink/60">
            Search patient records, register walk-in arrivals, and book consultations.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsRegisterOpen(true)}
        >
          <UserPlus size={16} />
          <span>Register Walk-In Patient</span>
        </Button>
      </div>

      {/* 2. Search & Controls Bar */}
      <Card className="flex items-center justify-between gap-4 py-4">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient by name (e.g. John, Eleanor)..."
            className="w-full rounded-full border border-ink/15 bg-sand/30 pl-10 pr-4 py-2 text-xs text-ink focus:border-clay focus:outline-none"
          />
        </div>

        <div className="text-xs text-ink/60 font-medium">
          Showing <strong>{patients.length}</strong> registered patient{patients.length !== 1 ? 's' : ''}
        </div>
      </Card>

      {/* Loading & Error States */}
      {loading && (
        <Card className="text-center py-12">
          <p className="text-ink/60">Searching patient records…</p>
        </Card>
      )}

      {error && (
        <Card className="border-brick/30 bg-brick/5 text-center py-8">
          <p className="text-brick font-medium">{error}</p>
        </Card>
      )}

      {/* 3. Patients Directory Table (Reference 3 Style) */}
      {!loading && !error && (
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sand/60 text-ink/70 uppercase tracking-wider text-[11px] font-semibold border-b border-ink/10">
                <tr>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Age / Gender</th>
                  <th className="px-6 py-4">Medical Notes</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-ink/50">
                      No matching patient records found.
                    </td>
                  </tr>
                ) : (
                  patients.map((p) => {
                    const initials = p.name
                      ? p.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)
                      : 'PT'

                    return (
                      <tr key={p.id} className="hover:bg-sand/30 transition-colors">
                        {/* Name + Avatar */}
                        <td className="px-6 py-4 font-medium text-ink">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-clay text-canvas text-xs font-bold shrink-0 shadow-xs">
                              {initials}
                            </div>
                            <div>
                              <span className="font-semibold block text-ink">
                                {p.name}
                              </span>
                              <span className="text-[10px] text-ink/50">
                                ID #{p.id} {p.email && `• ${p.email}`}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="px-6 py-4 text-ink font-semibold whitespace-nowrap">
                          {p.phoneNumber}
                        </td>

                        {/* Age & Gender */}
                        <td className="px-6 py-4 text-ink/70 whitespace-nowrap">
                          {p.gender || '—'} {p.age ? `(${p.age}y)` : ''}
                        </td>

                        {/* Medical Notes */}
                        <td className="px-6 py-4 text-ink/65 max-w-xs truncate">
                          {p.medicalHistory || 'No pre-existing conditions recorded'}
                        </td>

                        {/* Actions (Book Appointment Only) */}
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setBookingPatient(p)}
                          >
                            <Calendar size={13} className="text-clay" />
                            <span>Book Appointment</span>
                          </Button>
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

      {/* 4. Walk-In Registration Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register Walk-In Patient"
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
              placeholder="e.g. Arthur Pendelton"
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
                placeholder="e.g. 45"
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
              placeholder="e.g. +1 555-8392"
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
              placeholder="e.g. arthur@example.com"
              className="mt-1 w-full rounded-full border border-ink/15 bg-sand/30 px-4 py-2 text-sm text-ink focus:border-clay focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
              Symptoms / Medical Background
            </label>
            <textarea
              rows={2}
              value={regForm.medicalHistory}
              onChange={(e) => setRegForm({ ...regForm, medicalHistory: e.target.value })}
              placeholder="Record walk-in complaints, pre-existing conditions..."
              className="mt-1 w-full rounded-2xl border border-ink/15 bg-sand/30 p-3 text-sm text-ink focus:border-clay focus:outline-none"
            />
          </div>

          {regError && (
            <div className="flex items-center gap-2 rounded-xl bg-brick/10 p-3 text-xs text-brick font-medium">
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
              {regLoading ? 'Registering…' : 'Register & Book'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. Desk Booking Modal (Booking for Selected Patient) */}
      <Modal
        isOpen={!!bookingPatient}
        onClose={() => setBookingPatient(null)}
        title={`Book for ${bookingPatient?.name}`}
      >
        {bookingPatient && (
          <form onSubmit={handleDeskBook} className="space-y-4">
            <div className="rounded-2xl bg-sand/40 p-3.5 text-xs text-ink/75">
              <p>
                <strong>Patient:</strong> {bookingPatient.name} (Phone: {bookingPatient.phoneNumber})
              </p>
            </div>

            {/* Doctor Selection */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                Select Consulting Doctor *
              </label>
              <select
                required
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="mt-1 w-full rounded-full border border-ink/15 bg-sand/30 px-4 py-2 text-sm text-ink focus:border-clay focus:outline-none cursor-pointer"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.name} — {d.specialty} (${d.consultationFee?.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection & Real-Time Capacity Badge */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                Appointment Date *
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1 w-full rounded-full border border-ink/15 bg-sand/30 px-4 py-2 text-sm text-ink focus:border-clay focus:outline-none"
              />

              {selectedDoctorCapacity && (
                <div className="mt-2 flex items-center justify-between text-xs px-2">
                  <span className="text-ink/60">Doctor Availability:</span>
                  <span
                    className={`font-semibold ${
                      selectedDoctorCapacity.canBook ? 'text-brass font-bold' : 'text-brick'
                    }`}
                  >
                    {selectedDoctorCapacity.message}
                  </span>
                </div>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                Reason for Visit *
              </label>
              <textarea
                rows={2}
                required
                value={bookingReason}
                onChange={(e) => setBookingReason(e.target.value)}
                placeholder="Walk-in consultation reason..."
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
                onClick={() => setBookingPatient(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                disabled={bookingLoading || (selectedDoctorCapacity && !selectedDoctorCapacity.canBook)}
                loading={bookingLoading}
              >
                {bookingLoading ? 'Confirming…' : 'Confirm Front-Desk Booking'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
