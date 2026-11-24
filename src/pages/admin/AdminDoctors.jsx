import { useEffect, useState } from 'react'
import {
  UserPlus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Stethoscope,
  Filter,
} from 'lucide-react'
import {
  getDoctors,
  getSpecialties,
  createDoctor,
  updateDoctor,
  setDoctorAvailability,
  deleteDoctor,
} from '../../api/doctors'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([])
  const [specialties, setSpecialties] = useState([])
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState(null) // null = Create, doctorObj = Edit
  const [form, setForm] = useState({
    name: '',
    specialty: '',
    phoneNumber: '',
    email: '',
    shiftStartTime: '09:00',
    shiftEndTime: '17:00',
    consultationFee: '75',
    availableDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Success Toast / Message
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    loadDoctors()
    getSpecialties()
      .then(setSpecialties)
      .catch((err) => console.error('Could not load specialties:', err))
  }, [])

  const loadDoctors = () => {
    setLoading(true)
    setError('')
    getDoctors()
      .then(setDoctors)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  const showSuccess = (msg) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingDoctor(null)
    setForm({
      name: '',
      specialty: specialties[0] || 'General Medicine',
      phoneNumber: '',
      email: '',
      shiftStartTime: '09:00',
      shiftEndTime: '17:00',
      consultationFee: '75',
      availableDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    })
    setFormError('')
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (doc) => {
    setEditingDoctor(doc)
    setForm({
      name: doc.name || '',
      specialty: doc.specialty || '',
      phoneNumber: doc.phoneNumber || '',
      email: doc.email || '',
      shiftStartTime: doc.shiftStartTime ? doc.shiftStartTime.slice(0, 5) : '09:00',
      shiftEndTime: doc.shiftEndTime ? doc.shiftEndTime.slice(0, 5) : '17:00',
      consultationFee: doc.consultationFee != null ? String(doc.consultationFee) : '75',
      availableDays: doc.availableDays || [
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
      ],
    })
    setFormError('')
    setIsModalOpen(true)
  }

  // Toggle Day selection
  const handleToggleDay = (day) => {
    setForm((prev) => {
      const exists = prev.availableDays.includes(day)
      return {
        ...prev,
        availableDays: exists
          ? prev.availableDays.filter((d) => d !== day)
          : [...prev.availableDays, day],
      }
    })
  }

  // Submit Create or Edit
  const handleSubmitForm = async (e) => {
    e.preventDefault()
    if (formLoading) return

    setFormError('')

    // Client-side check for shift times (prevent common 12h vs 24h AM/PM error like 10:00 - 03:00)
    if (form.shiftStartTime && form.shiftEndTime && form.shiftEndTime <= form.shiftStartTime) {
      setFormError(
        `Shift end time (${form.shiftEndTime}) cannot be before or equal to start time (${form.shiftStartTime}). Please use 24-hour format (e.g. 15:00 for 3:00 PM).`
      )
      return
    }

    setFormLoading(true)

    const payload = {
      name: form.name.trim(),
      specialty: form.specialty.trim(),
      phoneNumber: form.phoneNumber.trim(),
      email: form.email.trim() || null,
      available: editingDoctor ? editingDoctor.available : true,
      shiftStartTime: form.shiftStartTime
        ? (form.shiftStartTime.length === 5 ? `${form.shiftStartTime}:00` : form.shiftStartTime)
        : null,
      shiftEndTime: form.shiftEndTime
        ? (form.shiftEndTime.length === 5 ? `${form.shiftEndTime}:00` : form.shiftEndTime)
        : null,
      consultationFee: form.consultationFee ? Number(form.consultationFee) : 0,
      availableDays: form.availableDays,
    }

    try {
      if (editingDoctor) {
        await updateDoctor(editingDoctor.id, payload)
        showSuccess(`Dr. ${payload.name} details successfully updated.`)
      } else {
        await createDoctor(payload)
        showSuccess(`Dr. ${payload.name} added to hospital roster.`)
      }
      setIsModalOpen(false)
      loadDoctors()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  // Toggle Doctor Active / On Leave Availability
  const handleToggleAvailability = async (doc) => {
    const newStatus = !doc.available
    try {
      await setDoctorAvailability(doc.id, newStatus)
      setDoctors((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, available: newStatus } : d))
      )
      showSuccess(
        `Dr. ${doc.name} marked as ${newStatus ? 'Active' : 'On Leave'}.`
      )
    } catch (err) {
      alert(`Could not toggle availability: ${err.message}`)
    }
  }

  // Delete Doctor
  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleteLoading) return

    setDeleteLoading(true)
    setDeleteError('')

    try {
      await deleteDoctor(deleteTarget.id)
      showSuccess(`Dr. ${deleteTarget.name} removed from roster.`)
      setDeleteTarget(null)
      loadDoctors()
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  const allDays = [
    { label: 'Mon', value: 'MONDAY' },
    { label: 'Tue', value: 'TUESDAY' },
    { label: 'Wed', value: 'WEDNESDAY' },
    { label: 'Thu', value: 'THURSDAY' },
    { label: 'Fri', value: 'FRIDAY' },
    { label: 'Sat', value: 'SATURDAY' },
    { label: 'Sun', value: 'SUNDAY' },
  ]

  const filteredDoctors = selectedSpecialty
    ? doctors.filter((d) => d.specialty === selectedSpecialty)
    : doctors

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-clay">
            Hospital Administration
          </span>
          <h2 className="mt-1 font-display text-3xl text-ink md:text-4xl">
            Physician Management
          </h2>
          <p className="mt-1 text-sm text-ink/60">
            Onboard new doctors, configure working days & shifts, and manage leave availability.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={handleOpenCreate}>
          <UserPlus size={16} />
          <span>Add New Physician</span>
        </Button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-2xl bg-[#FDEBB8] p-3.5 text-xs text-[#5C3E08] border border-[#DCA23A] shadow-soft">
          <CheckCircle2 size={16} className="text-[#957445]" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* 2. Controls & Specialty Filter */}
      <Card className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3">
          <Filter size={15} className="text-ink/40" />
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="rounded-full border border-ink/15 bg-sand/40 px-3.5 py-1.5 text-xs font-medium text-ink focus:border-clay focus:outline-none cursor-pointer"
          >
            <option value="">All Specialties ({doctors.length})</option>
            {specialties.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-ink/60 font-medium">
          Showing <strong>{filteredDoctors.length}</strong> active & consulting doctor{filteredDoctors.length !== 1 ? 's' : ''}
        </div>
      </Card>

      {/* Loading & Error States */}
      {loading && (
        <Card className="text-center py-12">
          <p className="text-ink/60">Loading doctor directory…</p>
        </Card>
      )}

      {error && (
        <Card className="border-brick/30 bg-brick/5 text-center py-8">
          <p className="text-brick font-medium">{error}</p>
        </Card>
      )}

      {/* 3. Doctors Table */}
      {!loading && !error && (
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sand/60 text-ink/70 uppercase tracking-wider text-[11px] font-semibold border-b border-ink/10">
                <tr>
                  <th className="px-6 py-4">Doctor</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Shift & Fee</th>
                  <th className="px-6 py-4">Available Days</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {filteredDoctors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-ink/50">
                      No physicians found matching this specialty.
                    </td>
                  </tr>
                ) : (
                  filteredDoctors.map((doc) => {
                    const initials = doc.name
                      ? doc.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)
                      : 'DR'

                    return (
                      <tr key={doc.id} className="hover:bg-sand/30 transition-colors">
                        {/* Name & Specialty */}
                        <td className="px-6 py-4 font-medium text-ink">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-clay text-canvas text-xs font-bold shrink-0 shadow-xs">
                              {initials}
                            </div>
                            <div>
                              <span className="font-semibold block text-ink">
                                Dr. {doc.name}
                              </span>
                              <span className="text-[11px] text-clay font-medium">
                                {doc.specialty}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-4 text-ink font-semibold whitespace-nowrap">
                          <div>{doc.phoneNumber}</div>
                          {doc.email && (
                            <div className="text-[10px] text-ink/50 font-normal">
                              {doc.email}
                            </div>
                          )}
                        </td>

                        {/* Shift & Fee */}
                        <td className="px-6 py-4 text-ink/70 whitespace-nowrap">
                          <div className="flex items-center gap-1 font-medium text-ink">
                            <Clock size={12} className="text-clay" />
                            <span>
                              {doc.shiftStartTime && doc.shiftEndTime
                                ? `${doc.shiftStartTime.slice(0, 5)} - ${doc.shiftEndTime.slice(0, 5)}`
                                : '09:00 - 17:00'}
                            </span>
                          </div>
                          <div className="text-[11px] text-brass font-bold">
                            ${doc.consultationFee ? doc.consultationFee.toFixed(2) : '0.00'} / visit
                          </div>
                        </td>

                        {/* Available Days */}
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {allDays.map((d) => {
                              const active = doc.availableDays?.includes(d.value)
                              return (
                                <span
                                  key={d.value}
                                  className={`text-[9px] font-semibold px-1 py-0.5 rounded ${
                                    active
                                      ? 'bg-clay text-canvas'
                                      : 'bg-sand/60 text-ink/30'
                                  }`}
                                >
                                  {d.label}
                                </span>
                              )
                            })}
                          </div>
                        </td>

                        {/* Status Toggle */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleAvailability(doc)}
                            className="flex items-center gap-1.5 cursor-pointer text-xs font-medium focus:outline-none"
                            title="Click to toggle availability"
                          >
                            {doc.available ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#FDEBB8] px-2.5 py-0.5 text-[11px] font-semibold text-[#5C3E08] border border-[#DCA23A]">
                                <ToggleRight size={14} className="text-[#957445]" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-brick/10 px-2.5 py-0.5 text-[11px] font-semibold text-brick border border-brick/20">
                                <ToggleLeft size={14} className="text-brick" />
                                On Leave
                              </span>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(doc)}
                              className="rounded-full p-1.5 text-ink/60 hover:bg-sand hover:text-ink transition cursor-pointer"
                              title="Edit Details"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(doc)}
                              className="rounded-full p-1.5 text-brick/70 hover:bg-brick/10 hover:text-brick transition cursor-pointer"
                              title="Remove Physician"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
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

      {/* 4. Create / Edit Doctor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDoctor ? `Edit Dr. ${editingDoctor.name}` : 'Onboard New Physician'}
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Eleanor Vance"
                className="mt-1 w-full rounded-full border border-ink/15 bg-sand/30 px-4 py-2 text-sm text-ink focus:border-clay focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                Specialty *
              </label>
              <input
                type="text"
                required
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                placeholder="e.g. Cardiology"
                className="mt-1 w-full rounded-full border border-ink/15 bg-sand/30 px-4 py-2 text-sm text-ink focus:border-clay focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                Phone Number (Unique) *
              </label>
              <input
                type="tel"
                required
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                placeholder="e.g. +1 555-4421"
                className="mt-1 w-full rounded-full border border-ink/15 bg-sand/30 px-4 py-2 text-sm text-ink focus:border-clay focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="e.g. eleanor@hospital.org"
                className="mt-1 w-full rounded-full border border-ink/15 bg-sand/30 px-4 py-2 text-sm text-ink focus:border-clay focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                Shift Start
              </label>
              <input
                type="time"
                value={form.shiftStartTime}
                onChange={(e) => setForm({ ...form, shiftStartTime: e.target.value })}
                className="mt-1 w-full rounded-full border border-ink/15 bg-sand/30 px-3 py-2 text-xs text-ink focus:border-clay focus:outline-none"
              />
              <span className="block mt-0.5 text-[10px] text-ink/40">24h format</span>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                Shift End
              </label>
              <input
                type="time"
                value={form.shiftEndTime}
                onChange={(e) => setForm({ ...form, shiftEndTime: e.target.value })}
                className="mt-1 w-full rounded-full border border-ink/15 bg-sand/30 px-3 py-2 text-xs text-ink focus:border-clay focus:outline-none"
              />
              <span className="block mt-0.5 text-[10px] text-ink/40">e.g. 15:00 for 3 PM</span>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                Fee ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.consultationFee}
                onChange={(e) => setForm({ ...form, consultationFee: e.target.value })}
                placeholder="75.00"
                className="mt-1 w-full rounded-full border border-ink/15 bg-sand/30 px-3 py-2 text-xs text-ink focus:border-clay focus:outline-none"
              />
              <span className="block mt-0.5 text-[10px] text-ink/40">USD per visit</span>
            </div>
          </div>

          {/* Working Days Checkbox Pills */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-ink/70 mb-1.5">
              Available Working Days
            </label>
            <div className="flex flex-wrap gap-2">
              {allDays.map((d) => {
                const isSelected = form.availableDays.includes(d.value)
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => handleToggleDay(d.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer select-none border ${
                      isSelected
                        ? 'bg-clay text-canvas border-clay shadow-xs'
                        : 'bg-sand/40 text-ink/65 border-ink/10 hover:bg-sand hover:text-ink'
                    }`}
                  >
                    {d.label}
                  </button>
                )
              })}
            </div>
          </div>

          {formError && (
            <div className="flex items-center gap-2 rounded-xl bg-brick/10 p-3 text-xs text-brick">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-ink/10">
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={formLoading}
              loading={formLoading}
            >
              {formLoading
                ? 'Saving…'
                : editingDoctor
                ? 'Save Changes'
                : 'Onboard Doctor'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Physician Removal"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-ink/80">
              Are you sure you want to permanently remove <strong>Dr. {deleteTarget.name}</strong> ({deleteTarget.specialty}) from the hospital database?
            </p>
            <p className="text-xs text-brick/80 bg-brick/5 p-3 rounded-xl">
              Warning: Any active bookings or appointment slots associated with this doctor may be affected.
            </p>

            {deleteError && (
              <div className="flex items-center gap-2 rounded-xl bg-brick/10 p-3 text-xs text-brick">
                <AlertCircle size={16} />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={deleteLoading}
                loading={deleteLoading}
                onClick={handleConfirmDelete}
              >
                {deleteLoading ? 'Removing…' : 'Delete Doctor'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
