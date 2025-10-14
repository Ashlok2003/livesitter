import React, { useState, useCallback, useEffect } from 'react'
import { type StreamConfigProps } from '../types'
import { useStream } from '../hooks/useStream'
import { validateRtspUrl, generateStreamId } from '../utils/helpers'

const StreamConfig: React.FC<StreamConfigProps> = ({ onStreamStart }) => {
  const [rtspUrl, setRtspUrl] = useState<string>('')
  const [streamId, setStreamId] = useState<string>('default')
  const [isUrlValid, setIsUrlValid] = useState<boolean>(true)
  const { isLoading, error, startStream, stopStream, clearError } = useStream()

  useEffect(() => {
    // Generate a unique stream ID on component mount
    setStreamId(generateStreamId())
  }, [])

  const handleStartStream = useCallback(async () => {
    if (!rtspUrl.trim()) {
      return
    }

    if (!validateRtspUrl(rtspUrl)) {
      setIsUrlValid(false)
      return
    }

    setIsUrlValid(true)
    clearError()

    const success = await startStream(rtspUrl, streamId)
    if (success) {
      onStreamStart(rtspUrl, streamId)
    }
  }, [rtspUrl, streamId, startStream, onStreamStart, clearError])

  const handleStopStream = useCallback(async () => {
    clearError()
    await stopStream(streamId)
    setRtspUrl('')
  }, [streamId, stopStream, clearError])

  const handleGenerateId = useCallback(() => {
    setStreamId(generateStreamId())
  }, [])

  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const url = e.target.value
      setRtspUrl(url)
      if (url) {
        setIsUrlValid(validateRtspUrl(url))
      } else {
        setIsUrlValid(true)
      }
      clearError()
    },
    [clearError],
  )

  const predefinedStreams = [
    { name: 'Test Pattern', url: 'rtsp://rtsp.stream/pattern' },
    { name: 'Sample Movie', url: 'rtsp://rtsp.stream/movie' },
    { name: 'Earth Camera', url: 'rtsp://rtsp.stream/earth' },
  ]

  const handlePredefinedStream = useCallback(
    (url: string) => {
      setRtspUrl(url)
      setIsUrlValid(true)
      clearError()
    },
    [clearError],
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Stream Configuration</h2>
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
            }`}
          ></div>
          <span className="text-sm text-gray-600">{isLoading ? 'Processing...' : 'Ready'}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="rtsp-url" className="block text-sm font-medium text-gray-700 mb-2">
            RTSP Stream URL
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            id="rtsp-url"
            type="text"
            value={rtspUrl}
            onChange={handleUrlChange}
            placeholder="rtsp://your-stream-server.com/live"
            disabled={isLoading}
            className={`form-input ${
              !isUrlValid ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            }`}
          />
          {!isUrlValid && (
            <p className="mt-1 text-sm text-red-600">
              Please enter a valid RTSP URL (should start with rtsp://)
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Enter the RTSP URL of your live stream source
          </p>
        </div>

        <div>
          <label htmlFor="stream-id" className="block text-sm font-medium text-gray-700 mb-2">
            Stream Identifier
          </label>
          <div className="flex space-x-2">
            <input
              id="stream-id"
              type="text"
              value={streamId}
              onChange={(e) => setStreamId(e.target.value)}
              placeholder="Enter stream ID"
              disabled={isLoading}
              className="form-input flex-1"
            />
            <button
              type="button"
              onClick={handleGenerateId}
              disabled={isLoading}
              className="btn-secondary whitespace-nowrap px-4"
            >
              Generate
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Unique identifier for this stream session. Used for tracking and management.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-fade-in">
            <div className="flex items-center space-x-2 text-red-700">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <span className="font-medium">Error:</span>
                <span className="ml-1">{error}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-3 pt-2">
          <button
            onClick={handleStartStream}
            disabled={isLoading || !rtspUrl.trim() || !isUrlValid}
            className="btn-primary flex-1 flex items-center justify-center space-x-2 py-3"
          >
            {isLoading ? (
              <>
                <div className="loading-spinner w-5 h-5"></div>
                <span className="font-medium">Starting Stream...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">Start Stream</span>
              </>
            )}
          </button>

          <button
            onClick={handleStopStream}
            disabled={isLoading}
            className="btn-danger px-6 flex items-center space-x-2 py-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
              />
            </svg>
            <span className="font-medium">Stop</span>
          </button>
        </div>
      </div>

      {/* Predefined Streams */}
      <div className="border-t pt-6">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
          <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
              clipRule="evenodd"
            />
          </svg>
          <span>Quick Start - Test Streams</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {predefinedStreams.map((stream, index) => (
            <button
              key={index}
              onClick={() => handlePredefinedStream(stream.url)}
              disabled={isLoading}
              className="text-left p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors disabled:opacity-50"
            >
              <div className="font-medium text-gray-800">{stream.name}</div>
              <div className="text-sm text-gray-600 truncate">{stream.url}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Information Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2 flex items-center space-x-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <span>Using RTSP Streams</span>
        </h4>
        <ul className="text-blue-700 text-sm space-y-1">
          <li className="flex items-start space-x-2">
            <span className="mt-1">•</span>
            <span>
              RTSP URLs should start with <code className="bg-blue-100 px-1 rounded">rtsp://</code>
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="mt-1">•</span>
            <span>Streams are converted to HLS format for browser compatibility</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="mt-1">•</span>
            <span>It may take 10-30 seconds for the stream to initialize</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="mt-1">•</span>
            <span>Ensure your RTSP server is accessible from this application</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default StreamConfig
