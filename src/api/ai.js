import client from './client'

// Ask the Hospital AI Assistant a grounded question: { message }
export const askAi = (message) =>
  client.post('/ai/ask', { message }).then((res) => res.data)

// Get AI suggestion for medical specialty from patient symptoms: { symptoms }
export const suggestSpecialty = (symptoms) =>
  client.post('/ai/suggest-specialty', { symptoms }).then((res) => res.data)
