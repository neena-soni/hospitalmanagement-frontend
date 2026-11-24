import { useState, useEffect } from 'react'
import DnaBackground from './components/layout/DnaBackground'
import Navbar from './components/layout/Navbar'
import DoctorDiscovery from './pages/patient/DoctorDiscovery'
import MyAppointments from './pages/patient/MyAppointments'
import MyProfile from './pages/patient/MyProfile'
import DeskPatients from './pages/desk/DeskPatients'
import DeskSchedule from './pages/desk/DeskSchedule'
import DeskAvailability from './pages/desk/DeskAvailability'
import AdminDoctors from './pages/admin/AdminDoctors'
import AdminPatients from './pages/admin/AdminPatients'
import AdminAppointments from './pages/admin/AdminAppointments'
import DoctorConsultations from './pages/doctor/DoctorConsultations'
import DoctorSettings from './pages/doctor/DoctorSettings'
import AiCompanion from './components/ai/AiCompanion'
import Card from './components/ui/Card'
import StatusChip from './components/ui/StatusChip'
import { getAllPatients } from './api/patients'

export default function App() {
  const [currentRole, setCurrentRole] = useState('PATIENT')
  const [activeTab, setActiveTab] = useState('doctors')
  const [isAiOpen, setIsAiOpen] = useState(false)
  const [aiSpecialtyFilter, setAiSpecialtyFilter] = useState('')

  // Shared active patient state across Patient screens
  const [patients, setPatients] = useState([])
  const [activePatientId, setActivePatientId] = useState('')

  // Shared active doctor state across Doctor screens
  const [activeDoctorId, setActiveDoctorId] = useState('')

  useEffect(() => {
    getAllPatients()
      .then((data) => {
        setPatients(data)
        if (data.length > 0 && !activePatientId) {
          setActivePatientId(String(data[0].id))
        }
      })
      .catch((err) => console.error('Error loading patients:', err))
  }, [])

  const handlePatientCreated = (newPatient) => {
    setPatients((prev) => [...prev, newPatient])
    setActivePatientId(String(newPatient.id))
  }

  const handlePatientUpdated = (updated) => {
    setPatients((prev) =>
      prev.map((p) => (String(p.id) === String(updated.id) ? updated : p))
    )
  }

  const handleTabSelect = (tab) => {
    if (tab === 'ai') {
      setIsAiOpen(true)
    } else {
      setActiveTab(tab)
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Background ambient DNA */}
      <DnaBackground />

      {/* Floating Navigation & Role Switcher */}
      <Navbar
        currentRole={currentRole}
        onSelectRole={(role) => {
          setCurrentRole(role)
          setActiveTab(
            role === 'PATIENT'
              ? 'doctors'
              : role === 'DESK'
              ? 'patients'
              : role === 'ADMIN'
              ? 'doctors'
              : 'consultations'
          )
        }}
        activeTab={activeTab}
        onSelectTab={handleTabSelect}
      />

      {/* Main Content Area */}
      <main className="mx-auto max-w-5xl px-6 md:px-12 py-6 pb-24">
        {/* 1. Patient: Doctor Discovery & Booking */}
        {currentRole === 'PATIENT' && activeTab === 'doctors' && (
          <DoctorDiscovery
            initialSpecialty={aiSpecialtyFilter}
            patients={patients}
            selectedPatientId={activePatientId}
            onSelectPatientId={setActivePatientId}
            onPatientCreated={handlePatientCreated}
            onNavigateToAppointments={() => setActiveTab('appointments')}
          />
        )}

        {/* 2. Patient: My Appointments & Cancellation */}
        {currentRole === 'PATIENT' && activeTab === 'appointments' && (
          <MyAppointments
            patientId={activePatientId}
            onFindDoctors={() => setActiveTab('doctors')}
          />
        )}

        {/* 3. Patient: Health Profile */}
        {currentRole === 'PATIENT' && activeTab === 'profile' && (
          <MyProfile
            patientId={activePatientId}
            onPatientUpdated={handlePatientUpdated}
          />
        )}

        {/* 4. Registration Desk: Patients & Walk-Ins */}
        {currentRole === 'DESK' && activeTab === 'patients' && (
          <DeskPatients />
        )}

        {/* 5. Registration Desk: Appointments & Queue */}
        {currentRole === 'DESK' && activeTab === 'schedule' && (
          <DeskSchedule />
        )}

        {/* 6. Registration Desk: Doctor Availability Board */}
        {currentRole === 'DESK' && activeTab === 'availability' && (
          <DeskAvailability />
        )}

        {/* 7. Admin: Doctor Management */}
        {currentRole === 'ADMIN' && activeTab === 'doctors' && (
          <AdminDoctors />
        )}

        {/* 8. Admin: Master Patient Registry */}
        {currentRole === 'ADMIN' && activeTab === 'patients' && (
          <AdminPatients />
        )}

        {/* 9. Admin: Hospital Appointments Log */}
        {currentRole === 'ADMIN' && activeTab === 'appointments' && (
          <AdminAppointments />
        )}

        {/* 10. Doctor: Clinical Consultations Queue */}
        {currentRole === 'DOCTOR' && activeTab === 'consultations' && (
          <DoctorConsultations
            activeDoctorId={activeDoctorId}
            onSelectDoctorId={setActiveDoctorId}
          />
        )}

        {/* 11. Doctor: My Shift & Availability Settings */}
        {currentRole === 'DOCTOR' && activeTab === 'settings' && (
          <DoctorSettings
            activeDoctorId={activeDoctorId}
            onSelectDoctorId={setActiveDoctorId}
          />
        )}
      </main>

      {/* Floating 3D AI Mascot Companion & Slide-Over Drawer */}
      <AiCompanion
        isOpen={isAiOpen}
        onToggle={() => setIsAiOpen((prev) => !prev)}
        onSelectSpecialty={(spec) => {
          setAiSpecialtyFilter(spec)
          setActiveTab('doctors')
        }}
      />
    </div>
  )
}
