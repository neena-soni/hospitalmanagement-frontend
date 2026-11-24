import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ??
      'Cannot reach the server. Is the backend running?'
    return Promise.reject(new Error(message))
  },
)

export default client

/*Line 1: imports Axios, the library that makes HTTP calls.
Line 3: creates one shared Axios instance. baseURL: '/api' means client.get('/doctors') really calls /api/doctors.
Line 5: an interceptor is a function that runs on every response before your code sees it.
Line 6: if the response succeeded, pass it through unchanged.
Line 7: if it failed, run the function that follows.
Lines 8–10: your Spring ErrorResponse has a message field, like “Doctor is fully booked”. ?. safely reads it even when there is no response, and ?? supplies the fallback text if there’s nothing to read.
Line 11: turns the failure into an ordinary Error carrying that message, so every page can just show err.message.
Line 12: closes the interceptor.
Line 15: makes the client importable from other files. */