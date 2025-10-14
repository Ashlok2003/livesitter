import React, { useRef, useEffect, useState, useCallback } from 'react'
import Hls from 'hls.js'
import { type VideoPlayerProps } from '../types'
import { formatTime } from '../utils/helpers'

const VideoPlayer: React.FC<VideoPlayerProps> = ({ streamUrl, overlays }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)

  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [volume, setVolume] = useState<number>(1)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

  /* Initializing HLS streaming */
  useEffect(() => {
    const video = videoRef.current
    if (!video || !streamUrl) return

    setError(null)
    setIsLoading(true)

    const cleanupHls = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }

    if (Hls.isSupported()) {
      cleanupHls()

      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true,
        backBufferLength: 90,
        debug: false,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 60 * 1000 * 1000, // 60MB
        // Retry settings for manifest and fragments
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 6,
        manifestLoadingRetryDelay: 1000,
        manifestLoadingMaxRetryTimeout: 64000,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 4,
        levelLoadingRetryDelay: 1000,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,
        fragLoadingRetryDelay: 1000,
      })

      hlsRef.current = hls

      hls.loadSource(streamUrl)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed')
        setIsLoading(false)
        video.play().catch((err) => {
          console.error('Auto-play failed:', err)
          setError('Auto-play was prevented. Please click play to start the stream.')
        })
      })

      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.error('HLS error:', data)
        setIsLoading(false)
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError('Network error occurred. Please check your connection and stream URL.')
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError('Media error occurred. The stream might be unavailable or corrupted.')
              hls.recoverMediaError()
              break
            default:
              setError('An error occurred while loading the stream.')
              break
          }
          cleanupHls()
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      /* Native HLS support for (Safari) */
      video.src = streamUrl
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false)
        video.play().catch((err) => {
          console.error('Auto-play failed:', err)
          setError('Auto-play was prevented. Please click play to start the stream.')
        })
      })

      video.addEventListener('error', () => {
        setIsLoading(false)
        setError('Failed to load video stream.')
      })
    } else {
      setIsLoading(false)
      setError(
        'HLS is not supported in your browser. Please try using a modern browser like Chrome, Firefox, or Safari.',
      )
    }

    return cleanupHls
  }, [streamUrl])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play().catch((err: Error) => {
        console.error('Play failed:', err)
        setError('Failed to play video. Please check the stream URL and try again.')
      })
    }
  }, [isPlaying])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
  }, [])

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
      setDuration(videoRef.current.duration || 0)
    }
  }, [])

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
    }
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }, [])

  const toggleFullscreen = useCallback(() => {
    const videoContainer = videoRef.current?.parentElement
    if (!videoContainer) return

    if (!isFullscreen) {
      if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }, [isFullscreen])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const handleRetry = useCallback(() => {
    setError(null)
    setIsLoading(true)
    // Trigger reinitialization by changing the key
    // This will be handled by the parent component
  }, [])

  if (!streamUrl) {
    return (
      <div className="video-container flex items-center justify-center bg-gray-900">
        <div className="text-center text-white p-8">
          <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-gray-400"
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
          <h3 className="text-xl font-semibold mb-2">No Active Stream</h3>
          <p className="text-gray-400">Configure and start a stream to begin watching.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black rounded-xl overflow-hidden shadow-lg">
      {/* Video Container */}
      <div className="video-container">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
            <div className="text-center">
              <div className="loading-spinner w-12 h-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-white text-lg font-medium">Loading Stream...</p>
              <p className="text-gray-300 text-sm mt-2">This may take a few moments</p>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => setError('Failed to load video stream. Please check the stream URL.')}
          muted={volume === 0}
          playsInline
        />

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-90 z-10">
            <div className="text-center text-white p-6 max-w-md">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-red-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-xl font-semibold mb-2">Stream Error</h3>
              <p className="mb-4 text-red-100">{error}</p>
              <div className="flex space-x-3 justify-center">
                <button onClick={handleRetry} className="btn-primary">
                  Retry Stream
                </button>
                <button onClick={() => setError(null)} className="btn-secondary">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Overlays */}
        {overlays.map((overlay) => (
          <div
            key={overlay._id}
            className="overlay-item"
            style={{
              left: `${overlay.position.x}%`,
              top: `${overlay.position.y}%`,
              width: `${overlay.size.width}px`,
              height: `${overlay.size.height}px`,
              ...overlay.style,
            }}
          >
            {overlay.type === 'text' ? (
              <div
                className="w-full h-full flex items-center justify-center p-2"
                style={overlay.style}
              >
                {overlay.content}
              </div>
            ) : (
              <img
                src={overlay.content}
                alt="Overlay"
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error('Failed to load overlay image:', overlay.content)
                  e.currentTarget.style.display = 'none'
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Video Controls */}
      <div className="bg-gray-800 p-4 space-y-3">
        {/* Play/Pause & Volume Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePlay}
              className="flex items-center space-x-2 text-white hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!!error}
            >
              {isPlaying ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">Pause</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">Play</span>
                </>
              )}
            </button>

            <div className="flex items-center space-x-3 text-white">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 accent-primary-500 cursor-pointer"
              />
              <span className="text-sm font-medium w-10">{Math.round(volume * 100)}%</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Time Display */}
            <div className="text-white text-sm font-mono bg-gray-700 px-3 py-1 rounded">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:bg-gray-700 p-2 rounded transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center space-x-3">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            disabled={!!error || duration === 0}
            className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer
