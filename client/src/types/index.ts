export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface OverlayStyle {
  color?: string
  fontSize?: string
  backgroundColor?: string
  opacity?: number
  fontWeight?: string
  fontFamily?: string
  textShadow?: string
  border?: string
  borderRadius?: string
  padding?: string
}

export interface Overlay {
  _id: string
  name: string
  type: 'text' | 'image'
  content: string
  position: Position
  size: Size
  style: OverlayStyle
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateOverlayRequest {
  name: string
  type: 'text' | 'image'
  content: string
  position: Position
  size: Size
  style?: OverlayStyle
  is_active?: boolean
}

export interface UpdateOverlayRequest extends Partial<CreateOverlayRequest> {
  updated_at?: string
}

export interface StreamConfig {
  rtsp_url: string
  stream_id: string
}

export interface StreamResponse {
  message: string
  playlist_url: string
  stream_id: string
  status: string
}

export interface StreamStatus {
  stream_id: string
  rtsp_url: string
  started_at: string
  status: 'running' | 'stopped'
  playlist_url: string
}

export interface StreamStatusResponse {
  active_streams: StreamStatus[]
  total_streams: number
  status: string
}

export interface ApiError {
  error: string
}

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error'
  message?: string
  data?: T
}

export interface VideoPlayerProps {
  streamUrl: string | null
  overlays: Overlay[]
}

export interface OverlayManagerProps {
  onOverlaysUpdate: (overlays: Overlay[]) => void
}

export interface StreamConfigProps {
  onStreamStart: (url: string, streamId: string) => void
}

export interface AppSettings {
  auto_start_streams: boolean
  default_stream_quality: string
  max_concurrent_streams: number
  retention_days: number
  notifications_enabled: boolean
}
