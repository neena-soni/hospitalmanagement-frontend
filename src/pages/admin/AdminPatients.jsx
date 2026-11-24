import { useEffect, useState } from 'react'
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  User,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import {
  getAllPatients,
  getPatients,
  createPatient,
  updatePatient,
  deletePatient,
} from '../../api/patients'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'

export default function AdminPatients() {
  const [patients, setPatients] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState(null)
  const [form, setForm] = useState({
    name: '',
    dateOfBirth: '',
    age: '',
    gender: 'MALE',
    phoneNumber: '',
    email: '',
    medicalHistory: '',
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  // Auto-calculate age whenever dateOfBirth is changed
  const handleDobChange = (dob) => {
    let calculatedAge = form.age
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
    setForm((prev) => ({
      ...prev,
      dateOfBirth: dob,
      age: calculatedAge,
    }))
  }

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Success Notification
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    loadPatients()
  }, [])

  // Debounced search
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

  const showSuccess = (msg) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const handleOpenCreate = () => {
    setEditingPatient(null)
    setForm({
      name: '',
      dateOfBirth: '',
      age: '',
      gender: 'MALE',
      phoneNumber: '',
      email: '',
      medicalHistory: '',
    })
    setFormError('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (p) => {
    setEditingPatient(p)
    setForm({
      name: p.name || '',
      dateOfBirth: p.dateOfBirth || '',
      age: p.age != null ? String(p.age) : '',
      gender: p.gender || 'MALE',
      phoneNumber: p.phoneNumber || '',
      email: p.email || '',
      medicalHistory: p.medicalHistory || '',
    })
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault()
    if (formLoading) return

    setFormLoading(true)
    setFormError('')

    const payload = {
      name: form.name.trim(),
      dateOfBirth: form.dateOfBirth || null,
      age: form.age ? Number(form.age) : null,
      gender: form.gender,
      phoneNumber: form.phoneNumber.trim(),
      email: form.email.trim() || null,
      medicalHistory: form.medicalHistory.trim() || null,
    }

    try {
      if (editingPatient) {
        await updatePatient(editingPatient.id, payload)
        showSuccess(`Patient record for ${payload.name} updated.`)
      } else {
        await createPatient(payload)
        showSuccess(`Patient ${payload.name} successfully registered.`)
      }
      setIsModalOpen(false)
      loadPatients()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleteLoading) return

    setDeleteLoading(true)
    setDeleteError('')

    try {
      await deletePatient(deleteTarget.id)
      showSuccess(`Patient ${deleteTarget.name} removed from registry.`)
      setDeleteTarget(null)
      loadPatients()
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-clay">
            Hospital Administration
          </span>
          <h2 className="mt-1 font-display text-3xl text-ink md:text-4xl">
            Master Patient Registry
          </h2>
          <p className="mt-1 text-sm text-ink/60">
            View, search, edit demographics, and manage patient medical records across the hospital.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={handleOpenCreate}>
          <UserPlus size={16} />
          <span>Register New Patient</span>
        </Button>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-2xl bg-[#FDEBB8] p-3.5 text-xs text-[#5C3E08] border border-[#DCA23A] shadow-soft">
          <CheckCircle2 size={16} className="text-[#957445]" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

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
            placeholder="Search patient by name..."
            className="w-full rounded-full border border-ink/15 bg-sand/30 pl-10 pr-4 py-2 text-xs text-ink focus:border-clay focus:outline-none"
          />
        </div>

        <div className="text-xs text-ink/60 font-medium">
          Total Registered: <strong>{patients.length}</strong>
        </div>
      </Card>

      {/* Loading & Error States */}
      {loading && (
        <Card className="text-center py-12">
          <p className="text-ink/60">Loading patient directory…</p>
        </Card>
      )}

      {error && (
        <Card className="border-brick/30 bg-brick/5 text-center py-8">
          <p className="text-brick font-medium">{error}</p>
        </Card>
      )}

      {/* 3. Patients Table */}
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
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-ink/50">
                      No registered patients found.
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

                        {/* Actions */}
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="rounded-full p-1.5 text-ink/60 hover:bg-sand hover:text-ink transition cursor-pointer"
                              title="Edit Demographics"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(p)}
                              className="rounded-full p-1.5 text-brick/70 hover:bg-brick/10 hover:text-brick transition cursor-pointer"
                              title="Delete Patient Record"
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

      {/* 4. Create / Edit Patient Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPatient ? `Edit ${editingPatient.name}` : 'Register New Patient'}
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                Date of Birth
              </label>
              <input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={form.dateOfBirth}
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
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                placeholder="e.g. 34"
                className="mt-1 w-full rounded-full border border-ink/15 bg-sand/30 px-4 py-2 text-sm text-ink focus:border-clay focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
              Gender
            </label>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
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
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
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
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="e.g. eleanor@example.com"
              className="mt-1 w-full rounded-full border border-ink/15 bg-sand/30 px-4 py-2 text-sm text-ink focus:border-clay focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
              Medical Notes / Pre-existing Conditions
            </label>
            <textarea
              rows={3}
              value={form.medicalHistory}
              onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })}
              placeholder="Known allergies, medications, chronic illness..."
              className="mt-1 w-full rounded-2xl border border-ink/15 bg-sand/30 p-3 text-sm text-ink focus:border-clay focus:outline-none"
            />
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
                : editingPatient
                ? 'Save Changes'
                : 'Register Patient'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Patient Deletion"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-ink/80">
              Are you sure you want to permanently delete the patient record for{' '}
              <strong>{deleteTarget.name}</strong> (ID #{deleteTarget.id})?
            </p>
            <p className="text-xs text-brick/80 bg-brick/5 p-3 rounded-xl">
              Warning: Deleting a patient will remove all clinical history and records associated with this patient from the database.
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
                {deleteLoading ? 'Deleting…' : 'Delete Record'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
