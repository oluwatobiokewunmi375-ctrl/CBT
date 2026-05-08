import { useEffect, useState } from 'react'

export function useRealtimeAnalytics() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/realtime')
        .then(res => res.json())
        .then(setData)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return data
}
