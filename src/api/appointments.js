import client from './client'

// Book a new appointment: { patientId, doctorId, appointmentDate, reason }
export const bookAppointment = (appointmentData) =>
  client.post('/appointments', appointmentData).then((res) => res.data)

// List all appointments (Admin & Desk master list)
export const getAllAppointments = () =>
  client.get('/appointments').then((res) => res.data)

// Get single appointment by ID
export const getAppointmentById = (id) =>
  client.get(`/appointments/${id}`).then((res) => res.data)

// Get all appointments for a specific patient
export const getAppointmentsByPatient = (patientId) =>
  client.get(`/appointments/patient/${patientId}`).then((res) => res.data)

// Get all appointments for a specific doctor
export const getAppointmentsByDoctor = (doctorId) =>
  client.get(`/appointments/doctor/${doctorId}`).then((res) => res.data)

// Get all appointments on a specific date (yyyy-MM-dd)
export const getAppointmentsByDate = (date) =>
  client.get(`/appointments/date/${date}`).then((res) => res.data)

// Cancel a booked appointment
export const cancelAppointment = (id) =>
  client.patch(`/appointments/${id}/cancel`).then((res) => res.data)

// Admin only: Emergency cancel all bookings for a doctor on a specific date (sets status to CLINIC_CANCELLED)
export const emergencyCancelDoctorDate = (doctorId, date) =>
  client.patch(`/appointments/doctor/${doctorId}/cancel-date`, null, {
    params: { date },
  }).then((res) => res.data)

// Mark appointment as no-show (Desk/Doctor action for past or current appointments)
export const markNoShow = (id) =>
  client.patch(`/appointments/${id}/no-show`).then((res) => res.data)
