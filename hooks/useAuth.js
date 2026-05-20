import { useEffect, useState } from 'react'

// Consolidated auth: use server-side JWT cookie via /api/auth/profile
export default function useAuth() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const res = await fetch('/api/auth/profile')
        if (!mounted) return
        if (res.ok) {
          const data = await res.json()
          setUser(data?.profile || null)
        } else {
          setUser(null)
        }
      } catch (err) {
        if (mounted) setUser(null)
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [])

  return user
}
