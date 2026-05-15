'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { LogOut, BookOpen, Clock, CheckCircle, AlertCircle, TrendingUp, FileText } from 'lucide-react'

interface Exam {
  id: string
  title: string
  subject: { name: string }
  class: { name: string }
  duration: number
  totalQuestions: number
  totalMarks: number
  status: string
  startTime: string
  endTime: string
  _count: { results: number }
}

export default function StudentDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    completed: 0,
    pending: 0,
    passed: 0,
    avgScore: 0,
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    
    setUser(JSON.parse(userData))
    fetchExams()
  }, [router])

  const fetchExams = async () => {
    try {
      // This would call your actual API
      // For now, we'll use mock data
      setExams([
        {
          id: '1',
          title: 'Mathematics Final Exam',
          subject: { name: 'Mathematics' },
          class: { name: 'SS3A' },
          duration: 120,
          totalQuestions: 50,
          totalMarks: 100,
          status: 'PUBLISHED',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 86400000).toISOString(),
          _count: { results: 45 },
        },
        {
          id: '2',
          title: 'English Language CBT',
          subject: { name: 'English' },
          class: { name: 'SS3A' },
          duration: 90,
          totalQuestions: 40,
          totalMarks: 80,
          status: 'PUBLISHED',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 86400000).toISOString(),
          _count: { results: 42 },
        },
      ])

      setStats({
        completed: 15,
        pending: 3,
        passed: 12,
        avgScore: 78.5,
      })
    } catch (error) {
      console.error(error)
      toast.error('Failed to load exams')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('Logged out successfully')
    router.push('/')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            CBT Pro
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-400">
              Welcome, <span className="text-white font-semibold">{user.fullName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-slate-700 rounded-lg transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Completed Exams</p>
                <p className="text-3xl font-bold">{stats.completed}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Pending Exams</p>
                <p className="text-3xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-500 opacity-20" />
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Passed Exams</p>
                <p className="text-3xl font-bold">{stats.passed}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-emerald-500 opacity-20" />
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Average Score</p>
                <p className="text-3xl font-bold">{stats.avgScore}%</p>
              </div>
              <TrendingUp className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Exams Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Available Exams
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block">
                <div className="w-8 h-8 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            </div>
          ) : exams.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-slate-500 mb-4" />
              <p className="text-slate-400">No exams available yet</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{exam.title}</h3>
                      <p className="text-slate-400 text-sm mb-3">
                        <span className="text-slate-300">{exam.subject.name}</span>
                        {' • '}
                        <span className="text-slate-300">{exam.class.name}</span>
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-400">{exam.duration} mins</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-400">{exam.totalQuestions} questions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">{exam.totalMarks} marks</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Link
                        href={`/exam/${exam.id}`}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/20 transition"
                      >
                        Start Exam
                      </Link>
                      <Link
                        href={`/exam/${exam.id}/results`}
                        className="px-6 py-2 border border-slate-600 rounded-lg font-semibold hover:border-slate-400 transition"
                      >
                        View Results
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

