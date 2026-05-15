'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Trash2, Edit2, Plus, Upload, Loader2 } from 'lucide-react'

export default function AdminQuestionsPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<any[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [exams, setExams] = useState<any[]>([])

  const [formData, setFormData] = useState({
    examId: '',
    content: '',
    type: 'MULTIPLE_CHOICE',
    marks: 1,
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
  })

  useEffect(() => {
    fetchQuestions()
    fetchExams()
  }, [])

  useEffect(() => {
    const filtered = questions.filter(q =>
      q.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.exam?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredQuestions(filtered)
  }, [questions, searchTerm])

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch('/api/admin/questions', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setQuestions(data.questions || [])
      } else {
        toast.error('Failed to load questions')
      }
    } catch (err) {
      console.error('Error fetching questions:', err)
      toast.error('Error loading questions')
    } finally {
      setLoading(false)
    }
  }

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams/list')
      if (res.ok) {
        const data = await res.json()
        setExams(data.exams || [])
      }
    } catch (err) {
      console.error('Failed to load exams:', err)
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
        ? `/api/admin/questions/${editingId}`
        : '/api/admin/questions'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast.success(editingId ? 'Question updated' : 'Question created')
        setShowForm(false)
        resetForm()
        fetchQuestions()
      } else {
        toast.error('Failed to save question')
      }
    } catch (err) {
      toast.error('Error saving question')
    }
  }

  const resetForm = () => {
    setFormData({
      examId: '',
      content: '',
      type: 'MULTIPLE_CHOICE',
      marks: 1,
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
    })
    setEditingId(null)
  }

  const handleDelete = async (questionId: string) => {
    if (!confirm('Delete this question?')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/questions/${questionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        toast.success('Question deleted')
        fetchQuestions()
      } else {
        toast.error('Failed to delete question')
      }
    } catch (err) {
      toast.error('Error deleting question')
    }
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
            <h1 className="text-4xl font-bold text-white mb-2">❓ Questions Management</h1>
            <p className="text-slate-400">Create, edit, and manage exam questions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              New Question
            </button>
            <button
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
            >
              <Upload className="w-5 h-5" />
              Import CSV
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
            <p className="text-slate-400 text-sm">Total Questions</p>
            <p className="text-4xl font-bold text-white mt-2">{questions.length}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
            <p className="text-slate-400 text-sm">Question Types</p>
            <p className="text-4xl font-bold text-blue-400 mt-2">3</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
            <p className="text-slate-400 text-sm">Total Marks</p>
            <p className="text-4xl font-bold text-green-400 mt-2">
              {questions.reduce((sum, q) => sum + (q.marks || 1), 0)}
            </p>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-12 text-center">
              <p className="text-slate-400 text-lg">
                {questions.length === 0 ? 'No questions yet' : 'No matching questions'}
              </p>
            </div>
          ) : (
            filteredQuestions.map((question) => (
              <div
                key={question.id}
                className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full font-semibold">
                        {question.type}
                      </span>
                      <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                        {question.marks} mark{question.marks !== 1 ? 's' : ''}
                      </span>
                      <span className="text-slate-400 text-sm">
                        {question.exam?.title || 'No exam assigned'}
                      </span>
                    </div>
                    <h3 className="text-white font-medium mb-3">{question.content}</h3>
                    {question.optionA && (
                      <div className="text-sm text-slate-300 space-y-1">
                        <div>A) {question.optionA}</div>
                        <div>B) {question.optionB}</div>
                        <div>C) {question.optionC}</div>
                        <div>D) {question.optionD}</div>
                        <div className="mt-2 pt-2 border-t border-slate-600">
                          <span className="text-green-400">Correct: {question.correctAnswer}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {
                        // Handle edit
                        toast.success('Edit feature coming soon')
                      }}
                      className="p-2 hover:bg-slate-600 rounded transition text-blue-400"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(question.id)}
                      className="p-2 hover:bg-slate-600 rounded transition text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingId ? 'Edit Question' : 'Create New Question'}
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
                  Select Exam
                </label>
                <select
                  required
                  value={formData.examId}
                  onChange={(e) => setFormData({ ...formData, examId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Choose an exam</option>
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Question
                </label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Question Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="TRUE_FALSE">True/False</option>
                    <option value="ESSAY">Essay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Marks
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.marks}
                    onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {formData.type === 'MULTIPLE_CHOICE' && (
                <>
                  <div className="space-y-3 pt-4 border-t border-slate-600">
                    <h4 className="text-white font-semibold">Options</h4>
                    {['A', 'B', 'C', 'D'].map((letter) => (
                      <div key={letter}>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Option {letter}
                        </label>
                        <input
                          type="text"
                          value={formData[`option${letter}` as keyof typeof formData] as string}
                          onChange={(e) => setFormData({
                            ...formData,
                            [`option${letter}`]: e.target.value
                          })}
                          className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Correct Answer
                    </label>
                    <select
                      value={formData.correctAnswer}
                      onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  {editingId ? 'Update' : 'Create'} Question
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
