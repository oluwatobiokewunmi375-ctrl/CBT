'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { useExamStore } from '@/lib/store/examStore'
import { useOfflineStatus } from '@/lib/hooks/useOfflineStatus'
import { Clock, Zap, Users, CheckCircle, Wifi, WifiOff } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

export default function ExamPage() {
  const { exams, fetchExams, loading } = useExamStore()
  const { isOnline } = useOfflineStatus()

  useEffect(() => {
    fetchExams()
  }, [fetchExams])

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Available Exams</h1>
              <p className="text-gray-400">Take an exam to test your knowledge</p>
            </div>
            <Link href="/exam/create" className="btn-primary">
              + Create Exam
            </Link>
          </div>

          {/* Offline Status Banner */}
          {!isOnline && (
            <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-600/50 rounded-lg flex items-center space-x-3">
              <WifiOff className="text-yellow-400" size={20} />
              <div>
                <p className="text-yellow-300 font-medium">Offline Mode Active</p>
                <p className="text-yellow-200 text-sm">
                  You can still take exams offline. Changes will sync when you're back online.
                </p>
              </div>
            </div>
          )}

          {/* Exams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams && exams.length > 0 ? (
              exams.map((exam, index) => (
                <div key={index} className="card hover:border-blue-500/50 transition-all group">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition">
                      {exam.title || `Exam ${index + 1}`}
                    </h3>
                    <p className="text-gray-400 text-sm">{exam.description || 'No description'}</p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-y border-slate-700">
                    <div className="flex items-center space-x-2">
                      <Clock size={18} className="text-blue-400" />
                      <div>
                        <p className="text-xs text-gray-400">Duration</p>
                        <p className="text-sm font-medium text-white">{exam.duration || 60} mins</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Zap size={18} className="text-yellow-400" />
                      <div>
                        <p className="text-xs text-gray-400">Questions</p>
                        <p className="text-sm font-medium text-white">{exam.questionCount || 50}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users size={18} className="text-purple-400" />
                      <div>
                        <p className="text-xs text-gray-400">Students</p>
                        <p className="text-sm font-medium text-white">{exam.studentCount || 120}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle size={18} className="text-green-400" />
                      <div>
                        <p className="text-xs text-gray-400">Pass Rate</p>
                        <p className="text-sm font-medium text-white">{exam.passRate || '85%'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/exam/${exam.id}`}
                      className="flex-1 btn-primary text-center"
                    >
                      Take Exam
                    </Link>
                    <button className="btn-secondary px-4">
                      ⋮
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-400 mb-4">No exams available yet</p>
                <Link href="/exam/create" className="btn-primary inline-block">
                  Create the first exam
                </Link>
              </div>
            )}
          </div>

          {/* Offline Status for Available Exams */}
          {exams && exams.length > 0 && !isOnline && (
            <div className="mt-8 p-4 bg-blue-900/30 border border-blue-600/50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Wifi className="text-blue-400" size={18} />
                <p className="text-blue-300 font-medium">Offline Exams Available</p>
              </div>
              <p className="text-blue-200 text-sm">
                {exams.length} exam(s) are available offline. Your progress will be synced when reconnected.
              </p>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
