import { useState, useCallback, useEffect } from 'react'
import { streamApi, handleApiError } from '../services/api'

interface UseStreamReturn {
  isLoading: boolean
  error: string | null
  startStream: (rtspUrl: string, streamId: string) => Promise<boolean>
  stopStream: (streamId: string) => Promise<void>
  clearError: () => void
}

export const useStream = (): UseStreamReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const startStream = useCallback(async (rtspUrl: string, streamId: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await streamApi.start({ rtsp_url: rtspUrl, stream_id: streamId })
      return true
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const stopStream = useCallback(async (streamId: string): Promise<void> => {
    setIsLoading(true)
    try {
      await streamApi.stop(streamId)
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  useEffect(() => {
    return () => {
      setError(null)
    }
  }, [])

  return {
    isLoading,
    error,
    startStream,
    stopStream,
    clearError,
  }
}
