import React, { useCallback, useEffect, useState } from 'react'
import OverlayManager from './components/OverlayManager'
import StreamConfig from './components/StreamConfig'
import VideoPlayer from './components/VideoPlayer'
import { checkServerHealth } from './services/api'
import { type Overlay } from './types'

export default function App(): React.ReactElement {
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [overlays, setOverlays] = useState<Overlay[]>([])
  const [activeStream, setActiveStream] = useState<string | null>(null)
  const [isServerHealthy, setIsServerHealthy] = useState<boolean>(true)
  const [streamKey, setStreamKey] = useState<number>(0)

  // Check server health on component mount
  useEffect(() => {
    const checkHealth = async () => {
      const healthy = await checkServerHealth()
      setIsServerHealthy(healthy)
    }

    checkHealth()
    /* Check health every 30 seconds */
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleStreamStart = useCallback((_url: string, streamId: string) => {
    // Use relative URL to go through Nginx proxy
    const playlistUrl = `${import.meta.env.VITE_API_BASE_URL}/streams/${streamId}/playlist.m3u8`
    setStreamUrl(playlistUrl)
    setActiveStream(streamId)
    // Force VideoPlayer re-render by changing key
    setStreamKey((prev) => prev + 1)
  }, [])

  const handleOverlaysUpdate = useCallback((updatedOverlays: Overlay[]) => {
    setOverlays(updatedOverlays)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">LiveSitter</h1>
                <p className="text-gray-500 text-xs">Stream Management Platform</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className={isServerHealthy ? 'badge-success' : 'badge-error'}>
                <div
                  className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    isServerHealthy ? 'bg-green-500 animate-pulse' : 'bg-red-500 animate-pulse'
                  }`}
                ></div>
                <span>{isServerHealthy ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Server Offline Banner */}
      {!isServerHealthy && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-center space-x-2 text-red-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">
                Backend server is offline. Some features may not work properly.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Stream & Video */}
          <div className="xl:col-span-2 space-y-6">
            {/* Stream Configuration */}
            <div className="card">
              <StreamConfig onStreamStart={handleStreamStart} />
            </div>

            {/* Video Player */}
            <div className="card p-0 overflow-hidden">
              <VideoPlayer key={streamKey} streamUrl={streamUrl} overlays={overlays} />
              {activeStream && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Active Stream:{' '}
                      <code className="bg-blue-50 text-blue-600 px-2 py-1 rounded font-mono text-xs border border-blue-200">
                        {activeStream}
                      </code>
                    </span>
                    <span className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-600 font-medium">Live</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Overlay Manager */}
          <div className="xl:col-span-1">
            <div className="card sticky top-20">
              <OverlayManager onOverlaysUpdate={handleOverlaysUpdate} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">LiveStream App</h3>
              <p className="text-gray-600 text-sm">
                A production-grade application for RTSP livestreaming with custom overlay
                management. Built with Flask, React, TypeScript, and Tailwind CSS.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
              <ul className="text-gray-600 text-sm space-y-2">
                <li>• RTSP to HLS Stream Conversion</li>
                <li>• Custom Text & Image Overlays</li>
                <li>• Real-time Video Controls</li>
                <li>• MongoDB Data Persistence</li>
                <li>• Docker Containerization</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Technology</h3>
              <div className="text-gray-600 text-sm space-y-2">
                <div>Backend: Flask, MongoDB, FFmpeg</div>
                <div>Frontend: React, TypeScript, Tailwind</div>
                <div>Infrastructure: Docker, Nginx</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-6 text-center">
            <p className="text-gray-500 text-sm">LiveStream App &copy; 2025 - Ashlok Chaudhary</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
