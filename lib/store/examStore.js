import { useCallback, useState } from 'react'

export const useExamStore = () => {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchExams = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) {
        setError('Unauthorized')
        setExams([])
        return
      }

      const res = await fetch('/api/exam/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Unable to fetch exams')
      }

      const data = await res.json()
      setExams(data.exams || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch exams')
      setExams([])
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    exams,
    loading,
    error,
    fetchExams,
  }
}
