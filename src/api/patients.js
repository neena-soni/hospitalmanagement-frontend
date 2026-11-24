import client from './client'

// Search patients by name (optional)
export const getPatients = (name) =>
  client.get('/patients', { params: name ? { name } : {} }).then((res) => res.data)

// List all registered patients
export const getAllPatients = () =>
  client.get('/patients/all').then((res) => res.data)

// Get single patient profile by ID
export const getPatientById = (id) =>
  client.get(`/patients/${id}`).then((res) => res.data)

// Create a new patient (used by self-register or front-desk walk-in)
export const createPatient = (patientData) =>
  client.post('/patients', patientData).then((res) => res.data)

// Update an existing patient
export const updatePatient = (id, patientData) =>
  client.put(`/patients/${id}`, patientData).then((res) => res.data)

// Delete patient record
export const deletePatient = (id) =>
  client.delete(`/patients/${id}`).then((res) => res.data)
