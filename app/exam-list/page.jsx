'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { safeNavigate } from '../../lib/safeNavigate'
import toast from 'react-hot-toast'

export default function ExamList() {
  const router = useRouter()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      safeNavigate(router, '/login')
      return
    }

    const fetchExams = async () => {
      try {
        const res = await fetch('/api/exam/list', {
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

    fetchExams()
  }, [router])

  return (
    <div className="min-h-screen bg-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Student Exam Portal</p>
            <h1 className="text-4xl font-bold mt-3">Available Exams</h1>
            <p className="text-slate-400 mt-2 max-w-2xl">Choose a published exam to start the CBT session with live timer and auto-save support.</p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-10 text-center">
            <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
            <p className="mt-4 text-slate-300">Loading exams...</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-700 bg-red-950/80 p-8 text-red-300">
            {error}
          </div>
        ) : exams.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-10 text-center text-slate-400">
            <p>No exams are currently available.</p>
            <button
              onClick={() => safeNavigate(router, '/dashboard')}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Back to dashboard
            </button>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            {exams.map((exam) => (
              <div key={exam.id} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-cyan-300 mb-2">Published Exam</p>
                    <h2 className="text-2xl font-semibold text-white">{exam.title}</h2>
                    <p className="mt-3 text-slate-400">{exam.description || 'No description available.'}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-800 px-4 py-3 text-center text-sm text-slate-300">
                    <p>Duration</p>
                    <p className="mt-1 text-xl font-semibold text-white">{exam.duration}m</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3 text-sm text-slate-400">
                  <div className="rounded-2xl bg-slate-950/70 p-3">
                    <p>Questions</p>
                    <p className="mt-2 font-semibold text-white">{exam.questions?.length ?? 0}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/70 p-3">
                    <p>Total Marks</p>
                    <p className="mt-2 font-semibold text-white">{exam.totalMarks}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/70 p-3">
                    <p>Status</p>
                    <p className="mt-2 font-semibold text-white">{exam.status}</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => safeNavigate(router, `/exam/${exam.id}`)}
                    className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    Start Exam
                  </button>
                  <button
                    onClick={() => safeNavigate(router, `/exam/${exam.id}/results`)}
                    className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
                  >
                    View Result
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
