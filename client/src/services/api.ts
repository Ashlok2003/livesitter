import axios, { type AxiosResponse, AxiosError } from 'axios'
import type {
  Overlay,
  CreateOverlayRequest,
  UpdateOverlayRequest,
  StreamConfig,
  StreamResponse,
  StreamStatusResponse,
  ApiError,
  AppSettings,
} from '../types'

// Use relative URL to go through Nginx proxy (avoids CORS issues)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`)
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout:', error)
      return Promise.reject(new Error('Request timeout. Please try again.'))
    }

    if (!error.response) {
      console.error('Network error:', error)
      return Promise.reject(new Error('Network error. Please check your connection.'))
    }

    return Promise.reject(error)
  },
)

/* Overlay APIs */
export const overlayApi = {
  create: async (data: CreateOverlayRequest): Promise<{ id: string; message: string }> => {
    const response: AxiosResponse<{ id: string; message: string }> = await api.post(
      '/overlays/',
      data,
    )
    return response.data
  },

  getAll: async (): Promise<Overlay[]> => {
    const response: AxiosResponse<{ overlays: Overlay[] }> = await api.get('/overlays/')
    return response.data.overlays
  },

  get: async (id: string): Promise<Overlay> => {
    const response: AxiosResponse<{ overlay: Overlay }> = await api.get(`/overlays/${id}`)
    return response.data.overlay
  },

  update: async (id: string, data: UpdateOverlayRequest): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.put(`/overlays/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.delete(`/overlays/${id}`)
    return response.data
  },
}

/* Streaming APIs */
export const streamApi = {
  start: async (config: StreamConfig): Promise<StreamResponse> => {
    const response: AxiosResponse<StreamResponse> = await api.post('/streams/start', config)
    return response.data
  },

  stop: async (streamId: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.post('/streams/stop', {
      stream_id: streamId,
    })
    return response.data
  },

  getStatus: async (): Promise<StreamStatusResponse> => {
    const response: AxiosResponse<StreamStatusResponse> = await api.get('/streams/status')
    return response.data
  },
}

/* Settings APIs */
export const settingsApi = {
  get: async (): Promise<AppSettings> => {
    const response: AxiosResponse<{ settings: AppSettings }> = await api.get('/settings')
    return response.data.settings
  },

  update: async (data: Partial<AppSettings>): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.post('/settings', data)
    return response.data
  },

  health: async (): Promise<{ status: string }> => {
    const response: AxiosResponse<{ status: string }> = await api.get('/settings/health')
    return response.data
  },
}

/* Error handler utility */
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Server responded with error status
      const apiError = error.response.data as ApiError
      return apiError.error || `Server error: ${error.response.status}`
    } else if (error.request) {
      // Request made but no response received
      return 'No response from server. Please check if the server is running.'
    }
  }

  // Generic error
  return error instanceof Error ? error.message : 'An unexpected error occurred'
}

// Health check
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    await settingsApi.health()
    return true
  } catch {
    return false
  }
}

export default api
