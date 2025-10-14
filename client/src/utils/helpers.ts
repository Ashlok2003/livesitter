export const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) {
    return '0:00'
  }

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const validateRtspUrl = (url: string): boolean => {
  // Allow RTSP URLs
  try {
    const urlObj = new URL(url)
    if (urlObj.protocol === 'rtsp:' || urlObj.protocol === 'file:') {
      return true
    }
  } catch {
    // Not a valid URL, check if it's an absolute path
  }

  // Allow absolute file paths (for local testing)
  if (url.startsWith('/')) {
    return true
  }

  return false
}

export const generateStreamId = (): string => {
  return `stream_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: number | undefined
  return (...args: Parameters<T>) => {
    if (timeout !== undefined) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(...args), wait)
  }
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const classNames = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ')
}

export const isImageUrl = (url: string): boolean => {
  return /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(url)
}

export const getDefaultOverlayStyle = (type: 'text' | 'image'): Record<string, string> => {
  if (type === 'text') {
    return {
      color: '#ffffff',
      fontSize: '16px',
      backgroundColor: 'transparent',
      fontWeight: 'normal',
      textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
    }
  }
  return {}
}
