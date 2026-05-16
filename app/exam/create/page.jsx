'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateExam() {
  const router = useRouter()
  const [redirected, setRedirected] = useState(false)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      router.push('/login')
      return
    }

    setTimeout(() => {
      setRedirected(true)
      router.push('/admin/exams/create')
    }, 100)
  }, [router])

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-10">
      <div className="max-w-xl rounded-3xl border border-slate-800 bg-slate-900/95 p-10 text-center shadow-2xl shadow-slate-950/30">
        <h1 className="text-3xl font-semibold mb-4">Create Exam</h1>
        <p className="text-slate-400 mb-6">Redirecting to the exam creation page for authorized users...</p>
        {redirected ? (
          <p className="text-slate-300">If you are not redirected, please <button onClick={() => router.push('/admin/exams/create')} className="font-semibold text-cyan-300 hover:text-cyan-200">click here</button>.</p>
        ) : (
          <p className="text-slate-500">Preparing the exam creation workspace...</p>
        )}
      </div>
    </div>
  )
}
