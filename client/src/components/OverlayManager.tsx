import React, { useCallback, useEffect, useState } from 'react'
import { handleApiError, overlayApi } from '../services/api'
import type { CreateOverlayRequest, Overlay, OverlayManagerProps } from '../types'
import { getDefaultOverlayStyle } from '../utils/helpers'

const OverlayManager: React.FC<OverlayManagerProps> = ({ onOverlaysUpdate }) => {
  const [overlays, setOverlays] = useState<Overlay[]>([])
  const [newOverlay, setNewOverlay] = useState<CreateOverlayRequest>({
    name: '',
    type: 'text',
    content: '',
    position: { x: 10, y: 10 },
    size: { width: 200, height: 50 },
    style: getDefaultOverlayStyle('text'),
    is_active: true,
  })
  const [editingOverlay, setEditingOverlay] = useState<Overlay | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fetchOverlays = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await overlayApi.getAll()
      setOverlays(data)
      onOverlaysUpdate(data)
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [onOverlaysUpdate])

  useEffect(() => {
    fetchOverlays()
  }, [fetchOverlays])

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 3000)
  }, [])

  const createOverlay = async () => {
    if (!newOverlay.name.trim()) {
      setError('Overlay name is required')
      return
    }

    if (!newOverlay.content.trim()) {
      setError('Overlay content is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await overlayApi.create(newOverlay)
      setNewOverlay({
        name: '',
        type: 'text',
        content: '',
        position: { x: 10, y: 10 },
        size: { width: 200, height: 50 },
        style: getDefaultOverlayStyle('text'),
        is_active: true,
      })
      await fetchOverlays()
      showSuccess('Overlay created successfully!')
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const updateOverlay = async (id: string, updates: Partial<Overlay>) => {
    setLoading(true)
    try {
      await overlayApi.update(id, {
        ...updates,
        updated_at: new Date().toISOString(),
      })
      await fetchOverlays()
      showSuccess('Overlay updated successfully!')
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const deleteOverlay = async (id: string) => {
    if (
      !window.confirm('Are you sure you want to delete this overlay? This action cannot be undone.')
    ) {
      return
    }

    setLoading(true)
    try {
      await overlayApi.delete(id)
      await fetchOverlays()
      showSuccess('Overlay deleted successfully!')
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingOverlay) return

    if (!editingOverlay.name.trim()) {
      setError('Overlay name is required')
      return
    }

    if (!editingOverlay.content.trim()) {
      setError('Overlay content is required')
      return
    }

    await updateOverlay(editingOverlay._id, editingOverlay)
    setEditingOverlay(null)
  }

  const handleTypeChange = useCallback((type: 'text' | 'image') => {
    setNewOverlay((prev) => ({
      ...prev,
      type,
      style: getDefaultOverlayStyle(type),
      content: type === 'text' ? 'Sample Text' : '',
    }))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Overlay Manager</h2>
        <span className="bg-primary-100 text-primary-800 text-sm font-medium px-3 py-1 rounded-full">
          {overlays.length} overlay{overlays.length !== 1 ? 's' : ''}
        </span>
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
            <span>{error}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-fade-in">
          <div className="flex items-center space-x-2 text-green-700">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {loading && !editingOverlay && (
        <div className="flex items-center justify-center py-8">
          <div className="loading-spinner w-8 h-8 border-2 border-primary-500 border-t-transparent"></div>
          <span className="ml-3 text-gray-600">Loading overlays...</span>
        </div>
      )}

      {/* Create New Overlay Form */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center space-x-2">
          <svg
            className="w-5 h-5 text-primary-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create New Overlay</span>
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter overlay name"
              value={newOverlay.name}
              onChange={(e) => setNewOverlay({ ...newOverlay, name: e.target.value })}
              disabled={loading}
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => handleTypeChange('text')}
                className={`flex-1 py-2 px-3 rounded-lg border transition-colors ${
                  newOverlay.type === 'text'
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300'
                }`}
                disabled={loading}
              >
                Text
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('image')}
                className={`flex-1 py-2 px-3 rounded-lg border transition-colors ${
                  newOverlay.type === 'image'
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300'
                }`}
                disabled={loading}
              >
                Image
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {newOverlay.type === 'text' ? 'Text Content' : 'Image URL'}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              placeholder={newOverlay.type === 'text' ? 'Enter text to display' : 'Enter image URL'}
              value={newOverlay.content}
              onChange={(e) => setNewOverlay({ ...newOverlay, content: e.target.value })}
              disabled={loading}
              className="form-input"
            />
            {newOverlay.type === 'image' && (
              <p className="mt-1 text-xs text-gray-500">
                Supported formats: PNG, JPG, JPEG, GIF, SVG
              </p>
            )}
          </div>

          {/* Position Controls */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">X Position (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={newOverlay.position.x}
                onChange={(e) =>
                  setNewOverlay({
                    ...newOverlay,
                    position: { ...newOverlay.position, x: parseInt(e.target.value) || 0 },
                  })
                }
                disabled={loading}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Y Position (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={newOverlay.position.y}
                onChange={(e) =>
                  setNewOverlay({
                    ...newOverlay,
                    position: { ...newOverlay.position, y: parseInt(e.target.value) || 0 },
                  })
                }
                disabled={loading}
                className="form-input"
              />
            </div>
          </div>

          {newOverlay.type === 'text' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                <input
                  type="color"
                  value={newOverlay.style?.color || '#ffffff'}
                  onChange={(e) =>
                    setNewOverlay({
                      ...newOverlay,
                      style: { ...newOverlay.style, color: e.target.value },
                    })
                  }
                  disabled={loading}
                  className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                <select
                  value={parseInt(newOverlay.style?.fontSize || '16px')}
                  onChange={(e) =>
                    setNewOverlay({
                      ...newOverlay,
                      style: { ...newOverlay.style, fontSize: `${e.target.value}px` },
                    })
                  }
                  disabled={loading}
                  className="form-select"
                >
                  <option value="12">12px</option>
                  <option value="14">14px</option>
                  <option value="16">16px</option>
                  <option value="18">18px</option>
                  <option value="24">24px</option>
                  <option value="32">32px</option>
                  <option value="48">48px</option>
                </select>
              </div>
            </div>
          )}

          <button
            onClick={createOverlay}
            disabled={loading || !newOverlay.name.trim() || !newOverlay.content.trim()}
            className="btn-primary w-full flex items-center justify-center space-x-2 py-3"
          >
            {loading ? (
              <div className="loading-spinner w-5 h-5 border-white border-t-transparent"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            )}
            <span className="font-medium">Create Overlay</span>
          </button>
        </div>
      </div>

      {/* Existing Overlays */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">Existing Overlays</h3>

        {overlays.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
              />
            </svg>
            <p className="text-lg font-medium text-gray-400">No overlays created yet</p>
            <p className="text-sm mt-1">Create your first overlay to get started</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
            {overlays.map((overlay) => (
              <div
                key={overlay._id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-gray-900 truncate">{overlay.name}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          overlay.type === 'text'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {overlay.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {overlay.type === 'text'
                        ? overlay.content
                        : overlay.content.substring(0, 50) + '...'}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                      <span>
                        Position: {overlay.position.x}%, {overlay.position.y}%
                      </span>
                      <span>
                        Size: {overlay.size.width}×{overlay.size.height}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 ml-4">
                    <button
                      onClick={() => setEditingOverlay(overlay)}
                      disabled={loading}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Edit overlay"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteOverlay(overlay._id)}
                      disabled={loading}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete overlay"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Overlay Modal */}
      {editingOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Edit Overlay</h3>
                <button
                  onClick={() => setEditingOverlay(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editingOverlay.name}
                    onChange={(e) =>
                      setEditingOverlay({
                        ...editingOverlay,
                        name: e.target.value,
                      })
                    }
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <input
                    type="text"
                    value={editingOverlay.content}
                    onChange={(e) =>
                      setEditingOverlay({
                        ...editingOverlay,
                        content: e.target.value,
                      })
                    }
                    className="form-input"
                  />
                </div>

                {editingOverlay.type === 'text' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Text Color
                      </label>
                      <input
                        type="color"
                        value={editingOverlay.style?.color || '#ffffff'}
                        onChange={(e) =>
                          setEditingOverlay({
                            ...editingOverlay,
                            style: { ...editingOverlay.style, color: e.target.value },
                          })
                        }
                        className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Font Size
                      </label>
                      <select
                        value={parseInt(editingOverlay.style?.fontSize || '16px')}
                        onChange={(e) =>
                          setEditingOverlay({
                            ...editingOverlay,
                            style: { ...editingOverlay.style, fontSize: `${e.target.value}px` },
                          })
                        }
                        className="form-select"
                      >
                        <option value="12">12px</option>
                        <option value="14">14px</option>
                        <option value="16">16px</option>
                        <option value="18">18px</option>
                        <option value="24">24px</option>
                        <option value="32">32px</option>
                        <option value="48">48px</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleSaveEdit}
                    disabled={loading}
                    className="btn-primary flex-1 flex items-center justify-center space-x-2 py-2"
                  >
                    {loading ? (
                      <div className="loading-spinner w-4 h-4 border-white border-t-transparent"></div>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                    <span>Save Changes</span>
                  </button>
                  <button
                    onClick={() => setEditingOverlay(null)}
                    disabled={loading}
                    className="btn-secondary px-6 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OverlayManager
