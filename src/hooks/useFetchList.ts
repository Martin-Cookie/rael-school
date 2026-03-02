import { useState, useCallback } from 'react'

/**
 * Generic hook for fetching a list from an API endpoint.
 * Returns [data, fetchFn] — call fetchFn() to load/reload data.
 *
 * @param url - API endpoint URL
 * @param responseKey - key in the JSON response to extract (e.g. 'classrooms')
 * @param fallback - default value if key is missing (default: [])
 */
export function useFetchList<T = any[]>(
  url: string,
  responseKey: string,
  fallback: T = [] as unknown as T,
): [T, () => Promise<void>] {
  const [data, setData] = useState<T>(fallback)

  const load = useCallback(async () => {
    try {
      const res = await fetch(url)
      const json = await res.json()
      setData(json[responseKey] ?? fallback)
    } catch {
      // silent — consistent with existing behavior
    }
  }, [url, responseKey])

  return [data, load]
}
