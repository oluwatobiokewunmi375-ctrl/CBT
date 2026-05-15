'use client'

import { useEffect, useState } from "react"

export default function StudentDashboard() {
  const [student, setStudent] = useState(null)
  const [results, setResults] = useState([])
  const [upcomingExams, setUpcomingExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          setError("Not authenticated")
          return
        }

        // Fetch student profile
        const profileRes = await fetch("/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (profileRes.ok) {
          const profileData = await profileRes.json()
          setStudent(profileData.profile.student)
        }

        // Fetch student results
        const resultsRes = await fetch("/api/results/list", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (resultsRes.ok) {
          const resultsData = await resultsRes.json()
          setResults(resultsData.results || [])
        }

        const schoolId = profileData.profile.student?.school?.id
        if (schoolId) {
          const examsRes = await fetch(`/api/exams/${schoolId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })

          if (examsRes.ok) {
            const examsData = await examsRes.json()
            setUpcomingExams(examsData.data || [])
          }
        }

      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div style={{ padding: 40, fontFamily: 'Arial', textAlign: 'center' }}>
        Loading dashboard...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 40, fontFamily: 'Arial', textAlign: 'center', color: 'red' }}>
        Error: {error}
      </div>
    )
  }

  return (
    <div style={{ padding: 40, fontFamily: 'Arial' }}>
      <h1>🎓 Student Dashboard</h1>

      {student && (
        <div style={{ marginBottom: 30, padding: 20, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
          <h2>Welcome, {student.user?.fullName || 'Student'}</h2>
          <p><strong>Student ID:</strong> {student.studentNo}</p>
          <p><strong>Class:</strong> {student.classRoom?.name || 'Not assigned'}</p>
          <p><strong>School:</strong> {student.school?.name || 'Unknown'}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>

        <div>
          <h2>📊 My Results</h2>
          {results.length === 0 ? (
            <p style={{ color: '#666' }}>No results yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              {results.slice(0, 5).map((result) => (
                <div key={result.id} style={{
                  padding: 15,
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  backgroundColor: 'white'
                }}>
                  <h3 style={{ margin: '0 0 10px 0' }}>{result.exam?.title}</h3>
                  <p style={{ margin: '5px 0' }}>
                    <strong>Score:</strong> {result.score}/{result.totalMarks} ({result.percentage.toFixed(1)}%)
                  </p>
                  <p style={{ margin: '5px 0' }}>
                    <strong>Grade:</strong> {result.grade}
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                    {new Date(result.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2>📝 Available Exams</h2>
          {upcomingExams.length === 0 ? (
            <p style={{ color: '#666' }}>No exams available</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              {upcomingExams.slice(0, 5).map((exam) => (
                <div key={exam.id} style={{
                  padding: 15,
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  backgroundColor: 'white'
                }}>
                  <h3 style={{ margin: '0 0 10px 0' }}>{exam.title}</h3>
                  <p style={{ margin: '5px 0' }}>
                    <strong>Duration:</strong> {exam.duration} minutes
                  </p>
                  <p style={{ margin: '5px 0' }}>
                    <strong>Total Marks:</strong> {exam.totalMarks}
                  </p>
                  <p style={{ margin: '5px 0' }}>
                    <strong>Questions:</strong> {exam.questions?.length || 0}
                  </p>
                  <button
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      marginTop: 10
                    }}
                    onClick={() => window.location.href = `/exam/${exam.id}`}
                  >
                    Take Exam
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
