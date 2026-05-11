'use client'

import { useEffect, useState } from 'react'
import { useExamStore } from '@/lib/store/examStore'

export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(true)
  const { setOfflineMode } = useExamStore()

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setOfflineMode(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setOfflineMode(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check initial status
    setIsOnline(navigator.onLine)
    setOfflineMode(!navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOfflineMode])

  return { isOnline }
}
