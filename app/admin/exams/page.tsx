"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { safeNavigate } from '../../../lib/safeNavigate'
import toast from 'react-hot-toast'

export default function AdminExamsPage() {
  const router = useRouter()
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      safeNavigate(router, '/login')
      return
    }

    const loadExams = async () => {
      try {
        const res = await fetch('/api/admin/exams', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Unable to load exams')
        }

        const data = await res.json()
        setExams(data.exams || [])
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load exams'
        setError(message)
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    loadExams()
  }, [router])

  return (
    <div className="min-h-screen bg-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Exam Management</h1>
            <p className="text-slate-400 mt-2">View and manage exams you created.</p>
          </div>
          <button
            onClick={() => safeNavigate(router, '/admin/exams/create')}
            className="rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
          >
            Create New Exam
          </button>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-10 text-center">
            <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
            <p className="mt-4 text-slate-300">Loading exams...</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-700 bg-red-950/80 p-8 text-red-300">
            {error}
          </div>
        ) : exams.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-10 text-center text-slate-400">
            No exams found. Create a new exam to begin.
          </div>
        ) : (
          <div className="grid gap-6">
            {exams.map((exam) => (
              <div key={exam.id} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/20">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">{exam.title}</h2>
                    <p className="text-slate-400 mt-2">{exam.description || 'No description available.'}</p>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-400">
                      <span>{exam.duration} mins</span>
                      <span>{exam.totalMarks} marks</span>
                      <span>{exam.questions?.length ?? 0} questions</span>
                      <span>{exam.status}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => safeNavigate(router, `/exam/${exam.id}`)}
                      className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500"
                    >
                      Open Exam
                    </button>
                    <button
                      onClick={() => safeNavigate(router, `/exam/${exam.id}/results`)}
                      className="rounded-full border border-slate-700 bg-slate-950/80 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-slate-500"
                    >
                      Results
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

