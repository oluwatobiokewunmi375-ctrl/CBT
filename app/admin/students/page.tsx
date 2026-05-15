'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Trash2, Edit2, Plus, Loader2, Download } from 'lucide-react'

export default function AdminStudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<any[]>([])
  const [filteredStudents, setFilteredStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    studentNo: '',
    classRoomId: '',
    dob: '',
    gender: '',
  })

  const [classrooms, setClassrooms] = useState<any[]>([])

  useEffect(() => {
    fetchStudents()
    fetchClassrooms()
  }, [])

  useEffect(() => {
    const filtered = students.filter(s =>
      s.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentNo?.includes(searchTerm) ||
      s.user?.email?.includes(searchTerm)
    )
    setFilteredStudents(filtered)
  }, [students, searchTerm])

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      // Mock fetch - in production this would call /api/admin/students
      const mockStudents = [
        {
          id: '1',
          user: { id: 'u1', fullName: 'John Doe', email: 'john@test.com' },
          studentNo: '0001',
          classRoom: { id: 'c1', name: 'SS1A' },
          school: { id: 's1', name: 'Test School' },
          dob: '2007-05-15',
          gender: 'Male'
        },
        {
          id: '2',
          user: { id: 'u2', fullName: 'Jane Smith', email: 'jane@test.com' },
          studentNo: '0002',
          classRoom: { id: 'c1', name: 'SS1A' },
          school: { id: 's1', name: 'Test School' },
          dob: '2007-08-20',
          gender: 'Female'
        }
      ]
      setStudents(mockStudents)
    } catch (err) {
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const fetchClassrooms = async () => {
    try {
      const mockClassrooms = [
        { id: 'c1', name: 'SS1A' },
        { id: 'c2', name: 'SS1B' },
        { id: 'c3', name: 'SS2A' }
      ]
      setClassrooms(mockClassrooms)
    } catch (err) {
      console.error('Failed to load classrooms:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const url = editingId
        ? `/api/students/${editingId}`
        : '/api/auth/register'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          role: 'STUDENT',
          schoolCode: 'TEST_SCHOOL',
        }),
      })

      if (res.ok) {
        toast.success(editingId ? 'Student updated' : 'Student created')
        setShowForm(false)
        setFormData({
          email: '',
          password: '',
          fullName: '',
          studentNo: '',
          classRoomId: '',
          dob: '',
          gender: '',
        })
        setEditingId(null)
        fetchStudents()
      } else {
        toast.error('Failed to save student')
      }
    } catch (err) {
      toast.error('Error saving student')
    }
  }

  const handleDelete = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        toast.success('Student deleted')
        fetchStudents()
      } else {
        toast.error('Failed to delete student')
      }
    } catch (err) {
      toast.error('Error deleting student')
    }
  }

  const handleEdit = (student: any) => {
    setFormData({
      email: student.user?.email || '',
      password: '',
      fullName: student.user?.fullName || '',
      studentNo: student.studentNo || '',
      classRoomId: student.classRoom?.id || '',
      dob: student.dob || '',
      gender: student.gender || '',
    })
    setEditingId(student.id)
    setShowForm(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">👥 Students Management</h1>
            <p className="text-slate-400">Manage student accounts and enrollment</p>
          </div>
          <button
            onClick={() => {
              setFormData({
                email: '',
                password: '',
                fullName: '',
                studentNo: '',
                classRoomId: '',
                dob: '',
                gender: '',
              })
              setEditingId(null)
              setShowForm(true)
            }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Add Student
          </button>
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search by name, student ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
            <p className="text-slate-400 text-sm">Total Students</p>
            <p className="text-4xl font-bold text-white mt-2">{students.length}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
            <p className="text-slate-400 text-sm">Active This Term</p>
            <p className="text-4xl font-bold text-blue-400 mt-2">{students.length}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
            <p className="text-slate-400 text-sm">Average Performance</p>
            <p className="text-4xl font-bold text-green-400 mt-2">78.5%</p>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl overflow-hidden">
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-400 text-lg">
                {students.length === 0 ? 'No students yet. Add one to get started.' : 'No students match your search.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50 border-b border-slate-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Name</th>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Student ID</th>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Email</th>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Class</th>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Gender</th>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, idx) => (
                    <tr key={student.id} className={idx % 2 === 0 ? 'bg-slate-700/20' : 'bg-slate-700/10'}>
                      <td className="px-6 py-4 text-white font-medium">{student.user?.fullName}</td>
                      <td className="px-6 py-4 text-slate-300">{student.studentNo}</td>
                      <td className="px-6 py-4 text-slate-400">{student.user?.email}</td>
                      <td className="px-6 py-4 text-slate-300">{student.classRoom?.name || 'Unassigned'}</td>
                      <td className="px-6 py-4 text-slate-300">{student.gender || '-'}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(student)}
                          className="p-2 hover:bg-slate-600 rounded transition text-blue-400"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="p-2 hover:bg-slate-600 rounded transition text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingId ? 'Edit Student' : 'Add New Student'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Class
                </label>
                <select
                  value={formData.classRoomId}
                  onChange={(e) => setFormData({ ...formData, classRoomId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Class</option>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

