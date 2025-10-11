/**
 * Custom hook for fetching and paginating moments list
 * Handles loading moments with lightweight data for timeline/list views
 */

import { useState, useCallback } from 'react'

interface MomentListItem {
  id: string
  title: string
  preview: string
  summary: string | null
  timestamp: string | null
  created_at: string
}

interface UseMomentListReturn {
  moments: MomentListItem[]
  loading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

export function useMomentList(initialLimit: number = 20): UseMomentListReturn {
  const [moments, setMoments] = useState<MomentListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [initialLoadDone, setInitialLoadDone] = useState(false)

  /**
   * Fetch moments from the API
   */
  const fetchMoments = useCallback(async (skipCount: number, limit: number, append: boolean = true) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/moments?limit=${limit}&skip=${skipCount}`)

      if (!response.ok) {
        throw new Error('Failed to fetch moments')
      }

      const result = await response.json()
      const newMoments = result.data || []

      if (append) {
        setMoments((prev) => [...prev, ...newMoments])
      } else {
        setMoments(newMoments)
      }

      // Update hasMore flag - if we got fewer moments than requested, there are no more
      if (newMoments.length < limit) {
        setHasMore(false)
      }

      // If this is the first load and we got 0 moments, set hasMore to false
      if (skipCount === 0 && newMoments.length === 0) {
        setHasMore(false)
      }

      setSkip(skipCount + newMoments.length)
      setInitialLoadDone(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch moments'
      setError(errorMessage)
      setHasMore(false)
      setInitialLoadDone(true)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Load more moments (pagination)
   */
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    await fetchMoments(skip, initialLimit, true)
  }, [loading, hasMore, skip, initialLimit, fetchMoments])

  /**
   * Refresh the list from the beginning
   */
  const refresh = useCallback(async () => {
    setSkip(0)
    setHasMore(true)
    setInitialLoadDone(false)
    await fetchMoments(0, initialLimit, false)
  }, [initialLimit, fetchMoments])

  return {
    moments,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  }
}
