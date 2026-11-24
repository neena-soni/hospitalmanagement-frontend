import client from './client'

// List doctors with optional filters: { specialty, availableOnly }
export const getDoctors = (params) =>
  client.get('/doctors', { params }).then((res) => res.data)

// List all distinct specialties from doctors
export const getSpecialties = () =>
  client.get('/doctors/specialties').then((res) => res.data)

// Get single doctor by ID
export const getDoctorById = (id) =>
  client.get(`/doctors/${id}`).then((res) => res.data)

// Check appointment spots left for a doctor on a specific date (yyyy-MM-dd)
export const getDoctorCapacity = (id, date) =>
  client.get(`/doctors/${id}/capacity`, { params: { date } }).then((res) => res.data)

// Batch Capacity: Fetch capacity for all doctors on a specific date in ONE single API call
export const getBatchDoctorCapacity = (date) =>
  client.get('/doctors/capacity', { params: { date } }).then((res) => res.data)

// Admin: Add a new doctor
export const createDoctor = (doctorData) =>
  client.post('/doctors', doctorData).then((res) => res.data)

// Admin: Update doctor details
export const updateDoctor = (id, doctorData) =>
  client.put(`/doctors/${id}`, doctorData).then((res) => res.data)

// Admin: Toggle availability (on leave / active)
export const setDoctorAvailability = (id, available) =>
  client.patch(`/doctors/${id}/availability`, null, { params: { available } }).then((res) => res.data)

// Admin: Delete doctor
export const deleteDoctor = (id) =>
  client.delete(`/doctors/${id}`).then((res) => res.data)
