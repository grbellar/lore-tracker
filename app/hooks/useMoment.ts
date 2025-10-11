/**
 * Custom hook for managing Moment CRUD operations
 * Handles creating, updating, and deleting moments via the moments API
 */

import { useState, useCallback } from 'react'

interface MomentData {
  id?: string
  title: string
  content?: string
  summary?: string
  preview?: string
  timestamp?: string
}

interface UseMomentReturn {
  loading: boolean
  error: string | null
  success: boolean
  saveMoment: (data: MomentData) => Promise<any>
  updateMoment: (id: string, data: Partial<MomentData>) => Promise<any>
  deleteMoment: (id: string) => Promise<void>
  clearStatus: () => void
}

export function useMoment(): UseMomentReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const clearStatus = useCallback(() => {
    setError(null)
    setSuccess(false)
  }, [])

  /**
   * Create a new moment
   */
  const saveMoment = useCallback(async (data: MomentData) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/moments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save moment')
      }

      const result = await response.json()
      setSuccess(true)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save moment'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Update an existing moment
   */
  const updateMoment = useCallback(async (id: string, data: Partial<MomentData>) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`/api/moments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update moment')
      }

      const result = await response.json()
      setSuccess(true)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update moment'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Delete a moment
   */
  const deleteMoment = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`/api/moments/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete moment')
      }

      setSuccess(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete moment'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    success,
    saveMoment,
    updateMoment,
    deleteMoment,
    clearStatus,
  }
}
