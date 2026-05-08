'use client'

import { useEffect } from 'react'
import useAuth from '@/hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const user = useAuth()

  useEffect(() => {
    if (!user) {
      window.location.href = '/login'
    }
  }, [user])

  if (!user) return null

  return children
}
