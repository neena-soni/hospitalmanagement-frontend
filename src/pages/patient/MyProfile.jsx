import { useEffect, useState } from 'react'
import {
  User,
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Shield,
} from 'lucide-react'
import { getPatientById, updatePatient } from '../../api/patients'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

export default function MyProfile({ patientId, onPatientUpdated }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [success, setSuccess] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'MALE',
    phoneNumber: '',
    email: '',
    dateOfBirth: '',
    medicalHistory: '',
  })

  // Load patient details on mount or when patientId changes
  useEffect(() => {
    if (!patientId) {
      setLoading(false)
      return
    }
    loadProfile()
  }, [patientId])

  const loadProfile = () => {
    setLoading(true)
    setLoadError('')
    getPatientById(patientId)
      .then((data) => {
        setForm({
          name: data.name || '',
          age: data.age != null ? String(data.age) : '',
          gender: data.gender || 'MALE',
          phoneNumber: data.phoneNumber || '',
          email: data.email || '',
          dateOfBirth: data.dateOfBirth || '',
          medicalHistory: data.medicalHistory || '',
        })
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false))
  }

  // Handle Save
  const handleSave = async (e) => {
    e.preventDefault()
    if (saving) return

    setSaving(true)
    setSaveError('')
    setSuccess('')

    try {
      const updated = await updatePatient(patientId, {
        name: form.name.trim(),
        age: form.age ? Number(form.age) : null,
        gender: form.gender,
        phoneNumber: form.phoneNumber.trim(),
        email: form.email ? form.email.trim() : null,
        dateOfBirth: form.dateOfBirth || null,
        medicalHistory: form.medicalHistory.trim() || null,
      })
      setSuccess('Profile updated successfully!')
      setIsEditing(false)
      if (onPatientUpdated) {
        onPatientUpdated(updated)
      }
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const initials = form.name
    ? form.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'PT'

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-clay">
            Patient Portal
          </span>
          <h2 className="mt-1 font-display text-3xl text-ink md:text-4xl">
            My Health Profile
          </h2>
          <p className="mt-1 text-sm text-ink/60">
            Keep your personal, contact, and medical background up to date.
          </p>
        </div>

        {!loading && !loadError && (
          <Button
            variant={isEditing ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => {
              setIsEditing(!isEditing)
              setSaveError('')
              setSuccess('')
            }}
          >
            <Edit3 size={14} />
            <span>{isEditing ? 'Cancel Editing' : 'Edit Profile'}</span>
          </Button>
        )}
      </div>

      {/* Loading & Error States */}
      {loading && (
        <Card className="text-center py-12">
          <p className="text-ink/60">Loading profile data…</p>
        </Card>
      )}

      {loadError && (
        <Card className="border-brick/30 bg-brick/5 text-center py-8 space-y-3">
          <p className="text-brick font-medium">{loadError}</p>
          <Button variant="secondary" size="sm" onClick={loadProfile}>
            Retry Loading
          </Button>
        </Card>
      )}

      {/* 2. Main Profile Card */}
      {!loading && !loadError && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Identity Summary Bar */}
          <Card className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between bg-sand/40 border border-ink/10">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-clay text-canvas font-display text-2xl font-bold shadow-soft shrink-0">
                {initials}
              </div>
              <div>
                <h3 className="font-display text-2xl text-ink leading-tight">
                  {form.name || 'Patient'}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink/60">
                  <span className="rounded-full bg-sand px-2.5 py-0.5 font-semibold text-ink/70">
                    ID #{patientId}
                  </span>
                  <span>•</span>
                  <span>{form.gender}</span>
                  {form.age && (
                    <>
                      <span>•</span>
                      <span>{form.age} years old</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-ink/60 bg-canvas/80 px-4 py-2 rounded-full border border-ink/5 self-start md:self-auto">
              <Shield size={14} className="text-clay" />
              <span>Verified Patient Record</span>
            </div>
          </Card>

          {/* Feedback Alerts */}
          {success && (
            <div className="flex items-center gap-2.5 rounded-2xl bg-[#FDEBB8] border border-[#DCA23A] p-4 text-xs font-semibold text-[#5C3E08] animate-fadeIn">
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          {saveError && (
            <div className="flex items-center gap-2.5 rounded-2xl bg-brick/10 border border-brick/30 p-4 text-xs text-brick font-medium animate-fadeIn">
              <AlertCircle size={16} />
              <span>{saveError}</span>
            </div>
          )}

          {/* Form Fields Card */}
          <Card className="space-y-6">
            <h4 className="font-display text-lg text-ink border-b border-ink/10 pb-3">
              Personal & Contact Information
            </h4>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                  Full Name *
                </label>
                <div className="relative mt-1">
                  <User
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40"
                  />
                  <input
                    type="text"
                    required
                    disabled={!isEditing}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-full border border-ink/15 bg-sand/30 pl-10 pr-4 py-2 text-sm text-ink disabled:bg-sand/15 disabled:text-ink/60 focus:border-clay focus:outline-none"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                  Phone Number (Unique) *
                </label>
                <div className="relative mt-1">
                  <Phone
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40"
                  />
                  <input
                    type="tel"
                    required
                    disabled={!isEditing}
                    value={form.phoneNumber}
                    onChange={(e) =>
                      setForm({ ...form, phoneNumber: e.target.value })
                    }
                    className="w-full rounded-full border border-ink/15 bg-sand/30 pl-10 pr-4 py-2 text-sm text-ink disabled:bg-sand/15 disabled:text-ink/60 focus:border-clay focus:outline-none"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                  Email Address
                </label>
                <div className="relative mt-1">
                  <Mail
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40"
                  />
                  <input
                    type="email"
                    disabled={!isEditing}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. patient@example.com"
                    className="w-full rounded-full border border-ink/15 bg-sand/30 pl-10 pr-4 py-2 text-sm text-ink disabled:bg-sand/15 disabled:text-ink/60 focus:border-clay focus:outline-none"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                  Gender
                </label>
                <select
                  disabled={!isEditing}
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="mt-1 w-full rounded-full border border-ink/15 bg-sand/30 px-4 py-2 text-sm text-ink disabled:bg-sand/15 disabled:text-ink/60 focus:border-clay focus:outline-none cursor-pointer"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                  Age
                </label>
                <input
                  type="number"
                  min="0"
                  max="150"
                  disabled={!isEditing}
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className="mt-1 w-full rounded-full border border-ink/15 bg-sand/30 px-4 py-2 text-sm text-ink disabled:bg-sand/15 disabled:text-ink/60 focus:border-clay focus:outline-none"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                  Date of Birth
                </label>
                <div className="relative mt-1">
                  <Calendar
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40"
                  />
                  <input
                    type="date"
                    disabled={!isEditing}
                    value={form.dateOfBirth}
                    onChange={(e) =>
                      setForm({ ...form, dateOfBirth: e.target.value })
                    }
                    className="w-full rounded-full border border-ink/15 bg-sand/30 pl-10 pr-4 py-2 text-sm text-ink disabled:bg-sand/15 disabled:text-ink/60 focus:border-clay focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Medical History & Allergies */}
            <div className="pt-4 border-t border-ink/10">
              <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                Medical Background & Known Allergies
              </label>
              <div className="relative mt-1">
                <FileText
                  size={16}
                  className="absolute left-4 top-4 text-ink/40"
                />
                <textarea
                  rows={4}
                  disabled={!isEditing}
                  value={form.medicalHistory}
                  onChange={(e) =>
                    setForm({ ...form, medicalHistory: e.target.value })
                  }
                  placeholder="Record ongoing treatments, chronic conditions (e.g. hypertension, diabetes), or drug allergies..."
                  className="w-full rounded-2xl border border-ink/15 bg-sand/30 pl-10 pr-4 py-3 text-sm text-ink disabled:bg-sand/15 disabled:text-ink/60 focus:border-clay focus:outline-none"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-ink/50 ml-2">
                This history is visible to consulting doctors during appointments.
              </p>
            </div>

            {/* Save Button */}
            {isEditing && (
              <div className="flex justify-end gap-3 pt-4 border-t border-ink/10">
                <Button
                  variant="secondary"
                  size="md"
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    setSaveError('')
                    loadProfile()
                  }}
                >
                  Discard Changes
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  disabled={saving}
                  loading={saving}
                >
                  Save Profile
                </Button>
              </div>
            )}
          </Card>
        </form>
      )}
    </div>
  )
}
