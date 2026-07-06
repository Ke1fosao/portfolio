import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('portfolio_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original?._retry) {
      const refresh = localStorage.getItem('portfolio_refresh_token')
      if (refresh) {
        original._retry = true
        try {
          const response = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh })
          localStorage.setItem('portfolio_access_token', response.data.access)
          original.headers.Authorization = `Bearer ${response.data.access}`
          return api(original)
        } catch {
          localStorage.removeItem('portfolio_access_token')
          localStorage.removeItem('portfolio_refresh_token')
        }
      }
    }
    return Promise.reject(error)
  },
)

export const unwrap = (response) => response?.data?.results ?? response?.data ?? response
export default api
