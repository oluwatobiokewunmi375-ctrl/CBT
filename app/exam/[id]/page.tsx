"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"

export default function ExamPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string

  const [exam, setExam] = useState<any>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        if (!token) {
          router.push('/login')
          return
        }

        const res = await fetch(`/api/exam/${examId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (res.ok) {
          const data = await res.json()
          setExam(data.exam)
          setTimeLeft(data.exam.duration * 60) // Convert to seconds
        } else {
          setError("Failed to load exam")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading exam")
      } finally {
        setLoading(false)
      }
    }

    fetchExam()
  }, [examId, router])

  // Timer countdown
  useEffect(() => {
    if (!timeLeft || timeLeft <= 0 || submitted) return

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t && t <= 1) {
          handleSubmit()
          return 0
        }
        return (t || 0) - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, submitted])

  const handleAnswerSelect = (optionId: string) => {
    const question = exam.questions[currentQuestion]
    setAnswers((prev) => ({
      ...prev,
      [question.id]: optionId,
    }))
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleNext = () => {
    if (currentQuestion < exam.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handleSubmit = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) {
        router.push('/login')
        return
      }
      
      const formattedAnswers: Record<string, string> = {}

      exam.questions.forEach((q: any) => {
        formattedAnswers[q.id] = answers[q.id] || ""
      })

      const res = await fetch("/api/exam/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          examId,
          answers: formattedAnswers,
          timeSpent: (exam.duration * 60 - (timeLeft || 0)) / 60,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setSubmitted(true)
      } else {
        setError("Failed to submit exam")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error submitting exam")
    }
  }, [exam, answers, examId, timeLeft])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading exam...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-green-600 text-4xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Exam Submitted Successfully!
            </h2>
            <p className="text-gray-600 mb-8">
              Your exam has been submitted and is being graded.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!exam || !exam.questions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">No questions available</div>
      </div>
    )
  }

  const question = exam.questions[currentQuestion]
  const minutes = Math.floor((timeLeft || 0) / 60)
  const seconds = (timeLeft || 0) % 60
  const answeredCount = Object.keys(answers).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Timer */}
      <div className="bg-white shadow sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
              <p className="text-gray-600 text-sm mt-1">
                Question {currentQuestion + 1} of {exam.questions.length}
              </p>
            </div>
            <div className="text-right">
              <div
                className={`text-3xl font-bold ${
                  (timeLeft || 0) < 300 ? "text-red-600" : "text-gray-900"
                }`}
              >
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
              <p className="text-gray-600 text-sm">Time remaining</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-8">
              {/* Question */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {question.text}
                </h2>

                {/* Options */}
                <div className="space-y-3">
                  {question.options.map((option: any) => (
                    <button
                      key={option.id}
                      onClick={() => handleAnswerSelect(option.id)}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                        answers[question.id] === option.id
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 ${
                            answers[question.id] === option.id
                              ? "border-blue-600 bg-blue-600"
                              : "border-gray-300"
                          }`}
                        >
                          {answers[question.id] === option.id && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <span className="text-gray-900">{option.text}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex gap-4 border-t pt-8">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  className="px-6 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {currentQuestion < exam.questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Submit Exam
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Progress */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Progress</h3>
              <div className="text-sm text-gray-600 mb-4">
                {answeredCount} of {exam.questions.length} answered
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(answeredCount / exam.questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Question Navigator */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Questions</h3>
              <div className="grid grid-cols-5 gap-2">
                {exam.questions.map((q: any, index: number) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                      index === currentQuestion
                        ? "bg-blue-600 text-white"
                        : answers[q.id]
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
