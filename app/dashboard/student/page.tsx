"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { safeNavigate } from '../../../lib/safeNavigate'

export default function StudentDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [exams, setExams] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          safeNavigate(router, "/login")
          return
        }

        // Fetch profile
        const profileRes = await fetch("/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (profileRes.ok) {
          setProfile(await profileRes.json())
        }

        // Fetch available exams
        const examsRes = await fetch("/api/exam/list", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (examsRes.ok) {
          const data = await examsRes.json()
          setExams(data.exams || [])
        }

        // Fetch results
        const resultsRes = await fetch("/api/results/list", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (resultsRes.ok) {
          const data = await resultsRes.json()
          setResults(data.results || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    )
  }

  const studentProfile = profile?.profile?.student

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, {profile?.profile?.fullName}
              </h1>
              <p className="text-gray-600 mt-2">
                School: {studentProfile?.school?.name}
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("token")
                safeNavigate(router, "/login")
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-medium">Available Exams</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{exams.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-medium">Completed Exams</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{results.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-medium">Average Score</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {studentProfile?.averageScore || "0"}%
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-medium">Total Questions</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {exams.reduce((sum, e) => sum + (e.questionCount || 0), 0)}
            </div>
          </div>
        </div>

        {/* Available Exams */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Exams</h2>
          {exams.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
              No exams available at this time
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                    <p className="text-gray-600 text-sm mt-2">{exam.description}</p>
                    <div className="mt-4 space-y-2">
                      <p className="text-sm">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium ml-2">{exam.duration} minutes</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-600">Total Marks:</span>
                        <span className="font-medium ml-2">{exam.totalMarks}</span>
                      </p>
                    </div>
                    <Link
                      href={`/exam/${exam.id}`}
                      className="mt-6 block w-full bg-blue-600 text-white text-center py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                      Start Exam
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Results */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Results</h2>
          {results.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
              No results yet. Take an exam to get started!
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Exam
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {results.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {result.exam?.title}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {result.score}/{result.totalMarks}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {Math.round(result.percentage)}%
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            result.grade === "A"
                              ? "bg-green-100 text-green-800"
                              : result.grade === "B"
                                ? "bg-blue-100 text-blue-800"
                                : result.grade === "C"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : result.grade === "D"
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-red-100 text-red-800"
                          }`}
                        >
                          {result.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(result.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

