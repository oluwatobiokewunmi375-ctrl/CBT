'use client'

import { useAuthStore } from '@/lib/store/authStore'
import { useCallback } from 'react'

export const useApi = () => {
  const token = useAuthStore((state) => state.token)

  const request = useCallback(
    async (url, options = {}) => {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const error = new Error(`API Error: ${response.status}`)
        error.status = response.status
        throw error
      }

      return response.json()
    },
    [token]
  )

  return {
    get: (url) => request(url, { method: 'GET' }),
    post: (url, data) => request(url, { method: 'POST', body: JSON.stringify(data) }),
    put: (url, data) => request(url, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (url) => request(url, { method: 'DELETE' }),
  }
}
