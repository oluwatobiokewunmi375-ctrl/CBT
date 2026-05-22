import { useEffect, useState } from 'react'

export function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator === 'undefined' ? false : !navigator.onLine
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOffline }
}

