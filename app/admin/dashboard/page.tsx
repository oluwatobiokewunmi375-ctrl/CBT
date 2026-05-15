"use client"

import { useEffect, useState } from "react"

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [recentExams, setRecentExams] = useState<any[]>([])
  const [recentResults, setRecentResults] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("overview")

  // Form states
  const [newStudent, setNewStudent] = useState({
    email: "", password: "", fullName: "", studentNo: "", classRoomId: ""
  })
  const [newTeacher, setNewTeacher] = useState({
    email: "", password: "", fullName: "", department: "", employeeNo: ""
  })
  const [newClassroom, setNewClassroom] = useState({ name: "" })

  useEffect(() => {
    if (activeTab === "overview") {
      fetchDashboard()
    } else if (activeTab === "students") {
      fetchStudents()
    } else if (activeTab === "teachers") {
      fetchTeachers()
    } else if (activeTab === "classrooms") {
      fetchClassrooms()
    }
  }, [activeTab])

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Not authenticated")
        return
      }

      const res = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setRecentExams(data.recentExams)
        setRecentResults(data.recentResults)
      } else {
        const errorData = await res.json()
        setError(errorData.message || "Failed to load dashboard")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading dashboard")
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return
      const res = await fetch("/api/admin/students", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setStudents(data.students || [])
      }
    } catch (err) {
      console.error("Failed to fetch students:", err)
    }
  }

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return
      const res = await fetch("/api/admin/teachers", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setTeachers(data.teachers || [])
      }
    } catch (err) {
      console.error("Failed to fetch teachers:", err)
    }
  }

  const fetchClassrooms = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return
      const res = await fetch("/api/admin/classrooms", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setClassrooms(data.classRooms || [])
      }
    } catch (err) {
      console.error("Failed to fetch classrooms:", err)
    }
  }

  const createStudent = async () => {
    try {
      const token = localStorage.getItem("token")
      const rawUser = typeof window !== "undefined" ? localStorage.getItem("user") : null
      const parsedUser = rawUser ? JSON.parse(rawUser) : null
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newStudent,
          schoolId: parsedUser?.school?.id,
        }),
      })

      if (res.ok) {
        alert("Student created successfully!")
        setNewStudent({ email: "", password: "", fullName: "", studentNo: "", classRoomId: "" })
        fetchStudents()
      } else {
        const error = await res.json()
        alert("Error: " + error.error)
      }
    } catch (err) {
      alert("Error creating student")
    }
  }

  const createTeacher = async () => {
    try {
      const token = localStorage.getItem("token")
      const rawUser = typeof window !== "undefined" ? localStorage.getItem("user") : null
      const parsedUser = rawUser ? JSON.parse(rawUser) : null
      const res = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newTeacher,
          schoolId: parsedUser?.school?.id,
        }),
      })

      if (res.ok) {
        alert("Teacher created successfully!")
        setNewTeacher({ email: "", password: "", fullName: "", department: "", employeeNo: "" })
        fetchTeachers()
      } else {
        const error = await res.json()
        alert("Error: " + error.error)
      }
    } catch (err) {
      alert("Error creating teacher")
    }
  }

  const createClassroom = async () => {
    try {
      const token = localStorage.getItem("token")
      const rawUser = typeof window !== "undefined" ? localStorage.getItem("user") : null
      const parsedUser = rawUser ? JSON.parse(rawUser) : null
      const res = await fetch("/api/admin/classrooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newClassroom,
          schoolId: parsedUser?.school?.id,
        }),
      })

      if (res.ok) {
        alert("Classroom created successfully!")
        setNewClassroom({ name: "" })
        fetchClassrooms()
      } else {
        const error = await res.json()
        alert("Error: " + error.error)
      }
    } catch (err) {
      alert("Error creating classroom")
    }
  }

  if (loading && activeTab === "overview") {
    return (
      <main className="p-10">
        <div className="text-center">Loading dashboard...</div>
      </main>
    )
  }

  if (error && activeTab === "overview") {
    return (
      <main className="p-10">
        <div className="text-center text-red-600">{error}</div>
      </main>
    )
  }

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold mb-6">School Admin Dashboard</h1>

      <div className="mb-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 mr-2 rounded ${activeTab === "overview" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("students")}
          className={`px-4 py-2 mr-2 rounded ${activeTab === "students" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          Students
        </button>
        <button
          onClick={() => setActiveTab("teachers")}
          className={`px-4 py-2 mr-2 rounded ${activeTab === "teachers" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          Teachers
        </button>
        <button
          onClick={() => setActiveTab("classrooms")}
          className={`px-4 py-2 mr-2 rounded ${activeTab === "classrooms" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          Classrooms
        </button>
        <button
          onClick={() => window.location.href = "/admin/exams"}
          className="px-4 py-2 mr-2 rounded bg-green-600 text-white"
        >
          Manage Exams
        </button>
      </div>

      {activeTab === "overview" && stats && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700">Total Students</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700">Total Exams</h3>
              <p className="text-3xl font-bold text-green-600">{stats.totalExams}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700">Total Results</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.totalResults}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700">Average Score</h3>
              <p className="text-3xl font-bold text-orange-600">{stats.averageScore.toFixed(1)}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Recent Exams</h2>
              {recentExams.length === 0 ? (
                <p className="text-gray-500">No exams created yet</p>
              ) : (
                <div className="space-y-3">
                  {recentExams.map((exam) => (
                    <div key={exam.id} className="border-b pb-2">
                      <h3 className="font-medium">{exam.title}</h3>
                      <p className="text-sm text-gray-600">
                        By {exam.createdBy?.user?.fullName || "Unknown"} •
                        {exam._count.questions} questions •
                        {exam._count.results} submissions
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Recent Results</h2>
              {recentResults.length === 0 ? (
                <p className="text-gray-500">No results yet</p>
              ) : (
                <div className="space-y-3">
                  {recentResults.map((result) => (
                    <div key={result.id} className="border-b pb-2">
                      <h3 className="font-medium">{result.student.user.fullName}</h3>
                      <p className="text-sm text-gray-600">
                        {result.exam.title} • Score: {result.score}/{result.totalMarks} ({result.percentage.toFixed(1)}%)
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "students" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Manage Students</h2>

          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold mb-4">Add New Student</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input
                type="email"
                placeholder="Email"
                value={newStudent.email}
                onChange={e => setNewStudent({...newStudent, email: e.target.value})}
                className="border p-2 rounded"
              />
              <input
                type="password"
                placeholder="Password"
                value={newStudent.password}
                onChange={e => setNewStudent({...newStudent, password: e.target.value})}
                className="border p-2 rounded"
              />
              <input
                placeholder="Full Name"
                value={newStudent.fullName}
                onChange={e => setNewStudent({...newStudent, fullName: e.target.value})}
                className="border p-2 rounded"
              />
              <input
                placeholder="Student Number"
                value={newStudent.studentNo}
                onChange={e => setNewStudent({...newStudent, studentNo: e.target.value})}
                className="border p-2 rounded"
              />
              <select
                value={newStudent.classRoomId}
                onChange={e => setNewStudent({...newStudent, classRoomId: e.target.value})}
                className="border p-2 rounded"
              >
                <option value="">Select Classroom</option>
                {classrooms.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                onClick={createStudent}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add Student
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Current Students ({students.length})</h3>
            <div className="space-y-2">
              {students.map((student) => (
                <div key={student.id} className="border-b pb-2 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{student.user.fullName}</p>
                    <p className="text-sm text-gray-600">{student.user.email} • {student.studentNo}</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    Class: {student.classRoom?.name || "Not assigned"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "teachers" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Manage Teachers</h2>

          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold mb-4">Add New Teacher</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input
                type="email"
                placeholder="Email"
                value={newTeacher.email}
                onChange={e => setNewTeacher({...newTeacher, email: e.target.value})}
                className="border p-2 rounded"
              />
              <input
                type="password"
                placeholder="Password"
                value={newTeacher.password}
                onChange={e => setNewTeacher({...newTeacher, password: e.target.value})}
                className="border p-2 rounded"
              />
              <input
                placeholder="Full Name"
                value={newTeacher.fullName}
                onChange={e => setNewTeacher({...newTeacher, fullName: e.target.value})}
                className="border p-2 rounded"
              />
              <input
                placeholder="Department"
                value={newTeacher.department}
                onChange={e => setNewTeacher({...newTeacher, department: e.target.value})}
                className="border p-2 rounded"
              />
              <input
                placeholder="Employee Number"
                value={newTeacher.employeeNo}
                onChange={e => setNewTeacher({...newTeacher, employeeNo: e.target.value})}
                className="border p-2 rounded"
              />
              <button
                onClick={createTeacher}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add Teacher
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Current Teachers ({teachers.length})</h3>
            <div className="space-y-2">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="border-b pb-2">
                  <p className="font-medium">{teacher.user.fullName}</p>
                  <p className="text-sm text-gray-600">
                    {teacher.user.email} • {teacher.employeeNo} • {teacher.department}
                  </p>
                  <p className="text-sm text-gray-600">
                    Exams created: {teacher.exams.length}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "classrooms" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Manage Classrooms</h2>

          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold mb-4">Add New Classroom</h3>
            <div className="flex gap-4 mb-4">
              <input
                placeholder="Classroom Name (e.g., SS1 - Class A)"
                value={newClassroom.name}
                onChange={e => setNewClassroom({...newClassroom, name: e.target.value})}
                className="border p-2 rounded flex-1"
              />
              <button
                onClick={createClassroom}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add Classroom
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Current Classrooms ({classrooms.length})</h3>
            <div className="space-y-2">
              {classrooms.map((classroom) => (
                <div key={classroom.id} className="border-b pb-2">
                  <p className="font-medium">{classroom.name}</p>
                  <p className="text-sm text-gray-600">
                    Students: {classroom._count.students} • Subjects: {classroom.subjects?.length || 0}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

