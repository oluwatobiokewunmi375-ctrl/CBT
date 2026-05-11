'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { useAuthStore } from '@/lib/store/authStore'
import { useExamStore } from '@/lib/store/examStore'
import { BookOpen, Users, Award, Zap } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const { exams, fetchExams } = useExamStore()

  useEffect(() => {
    fetchExams()
  }, [fetchExams])

  const stats = [
    {
      title: 'Total Exams',
      value: '24',
      icon: BookOpen,
      color: 'bg-blue-600',
      change: '+12% this month',
    },
    {
      title: 'Students',
      value: '1,250',
      icon: Users,
      color: 'bg-purple-600',
      change: '+8% this month',
    },
    {
      title: 'Pass Rate',
      value: '82%',
      icon: Award,
      color: 'bg-green-600',
      change: '+5% this month',
    },
    {
      title: 'Performance',
      value: '4.8/5',
      icon: Zap,
      color: 'bg-yellow-600',
      change: 'Excellent',
    },
  ]

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome back, {user?.fullName || 'User'}!
            </h1>
            <p className="text-gray-400">
              Here's your dashboard overview for today
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="card hover:border-blue-500/50 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">{stat.title}</p>
                      <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                    </div>
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <Icon size={24} className="text-white" />
                    </div>
                  </div>
                  <p className="text-green-400 text-sm">{stat.change}</p>
                </div>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <div className="card">
                <h2 className="text-xl font-bold text-white mb-4">Recent Exams</h2>
                <div className="space-y-3">
                  {exams && exams.length > 0 ? (
                    exams.slice(0, 5).map((exam, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition"
                      >
                        <div>
                          <p className="text-white font-medium">{exam.title || `Exam ${index + 1}`}</p>
                          <p className="text-gray-400 text-sm">
                            {exam.studentCount || '0'} students • {exam.duration || '60'} mins
                          </p>
                        </div>
                        <Link
                          href={`/exam/${exam.id}`}
                          className="text-blue-400 hover:text-blue-300 font-medium"
                        >
                          View
                        </Link>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">No exams yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Access */}
            <div className="space-y-4">
              <div className="card">
                <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
                <div className="space-y-2">
                  <Link
                    href="/exam/create"
                    className="btn-primary w-full text-center block"
                  >
                    + Create Exam
                  </Link>
                  <Link
                    href="/results"
                    className="btn-secondary w-full text-center block"
                  >
                    View Results
                  </Link>
                  <Link
                    href="/analytics"
                    className="btn-secondary w-full text-center block"
                  >
                    Analytics
                  </Link>
                </div>
              </div>

              {/* Upgrade Banner */}
              <div className="card border-2 border-blue-600/50 bg-gradient-to-br from-blue-900/20 to-transparent">
                <p className="text-sm text-gray-300 mb-3">
                  Upgrade to Pro for advanced features
                </p>
                <button className="w-full btn-primary text-sm">Upgrade Now</button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

const link = {
  color: 'white',
  textDecoration: 'none'
}

const card = {
  background: 'white',
  padding: '25px',
  borderRadius: '12px'
}
