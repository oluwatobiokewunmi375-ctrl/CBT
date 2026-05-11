'use client'

import { useAuthStore } from '@/lib/store/authStore'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedRoute({ children }) {
  const router = useRouter()
  const { user, token } = useAuthStore()

  useEffect(() => {
    if (!user || !token) {
      router.push('/login')
    }
  }, [user, token, router])

  if (!user || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return children
}
