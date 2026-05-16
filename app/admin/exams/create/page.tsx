"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { safeNavigate } from "../../../../lib/safeNavigate"
import Link from "next/link"

interface Question {
  text: string
  marks: number
  type: string
  options: Array<{ text: string; isCorrect: boolean }>
}

export default function CreateExamPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [duration, setDuration] = useState(60)
  const [totalMarks, setTotalMarks] = useState(100)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    text: "",
    marks: 1,
    type: "MCQ",
    options: [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleAddQuestion = () => {
    if (!currentQuestion.text) {
      setError("Question text is required")
      return
    }

    const hasCorrectAnswer = currentQuestion.options.some((o) => o.isCorrect)
    if (!hasCorrectAnswer) {
      setError("Please mark at least one option as correct")
      return
    }

    setQuestions([...questions, currentQuestion])
    setCurrentQuestion({
      text: "",
      marks: 1,
      type: "MCQ",
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    })
    setError("")
  }

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...currentQuestion.options]
    newOptions[index].text = text
    setCurrentQuestion({ ...currentQuestion, options: newOptions })
  }

  const handleOptionCorrect = (index: number) => {
    const newOptions = currentQuestion.options.map((o, i) => ({
      ...o,
      isCorrect: i === index,
    }))
    setCurrentQuestion({ ...currentQuestion, options: newOptions })
  }

  const handleCreateExam = async () => {
    if (!title || !duration || !totalMarks || questions.length === 0) {
      setError("All fields are required and at least one question must be added")
      return
    }

    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        safeNavigate(router, "/login")
        return
      }

      const res = await fetch("/api/admin/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          duration,
          totalMarks,
          questions: questions.map((q) => ({
            text: q.text,
            marks: q.marks,
            type: q.type,
            options: q.options,
          })),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        safeNavigate(router, `/admin/exams/${data.exam.id}`)
      } else {
        const errorData = await res.json()
        // if backend indicates teacher is missing, navigate to admin dashboard
        if (errorData?.error === "Teacher not found") {
          safeNavigate(router, "/admin/dashboard")
          setError("Teacher not found. Redirecting to dashboard to create teachers.")
        } else {
          setError(errorData.error || "Failed to create exam")
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating exam")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Create Exam</h1>
            <Link
              href="/admin/exams"
              className="text-blue-600 hover:text-blue-800"
            >
              Back to Exams
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Exam Details */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Exam Details</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="e.g., Mathematics Final Exam"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="Exam description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Marks *
                </label>
                <input
                  type="number"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  min="1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Questions ({questions.length})</h2>

          {/* Question Editor */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg border-2 border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-4">Add New Question</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Text *
              </label>
              <textarea
                value={currentQuestion.text}
                onChange={(e) =>
                  setCurrentQuestion({ ...currentQuestion, text: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="Enter question text..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marks
                </label>
                <input
                  type="number"
                  value={currentQuestion.marks}
                  onChange={(e) =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      marks: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={currentQuestion.type}
                  onChange={(e) =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      type: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option>MCQ</option>
                  <option>Essay</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options (Mark the correct answer)
              </label>
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct"
                      checked={option.isCorrect}
                      onChange={() => handleOptionCorrect(idx)}
                      className="cursor-pointer"
                    />
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder={`Option ${idx + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleAddQuestion}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Question
            </button>
          </div>

          {/* Questions List */}
          {questions.length > 0 && (
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Q{idx + 1}: {q.text}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Marks: {q.marks} | Type: {q.type}
                      </p>
                      <div className="mt-2 text-sm text-gray-600">
                        {q.options.map((o, i) => (
                          <div key={i}>
                            {o.isCorrect ? "✓ " : "  "} {o.text}
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveQuestion(idx)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateExam}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Exam"}
          </button>
        </div>
      </div>
    </div>
  )
}

