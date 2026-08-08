import { useState, useEffect, useCallback, useRef } from 'react'
import { errMsg } from '../api/client.js'

// Small data-fetching hook that standardizes loading/error/reload across pages.
// `fetcher` returns a promise; `deps` re-runs it (like useEffect deps).
export function useApi(fetcher, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState('')
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const d = await fetcherRef.current()
      setData(d)
      return d
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (immediate) reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error, reload, setData }
}
