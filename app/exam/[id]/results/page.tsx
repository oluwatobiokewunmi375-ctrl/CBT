"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { safeNavigate } from '../../../../lib/safeNavigate'
import toast from 'react-hot-toast'
import { jsPDF } from 'jspdf'

export default function ExamResultPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      safeNavigate(router, '/login')
      return
    }

    const fetchResult = async () => {
      try {
        const res = await fetch(`/api/results/exam/${examId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Unable to load result')
        }

        const data = await res.json()
        setResult(data.result)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load result'
        setError(message)
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    fetchResult()
  }, [examId, router])

  const handleDownloadPdf = () => {
    if (!result) return
    const doc = new jsPDF({ unit: 'pt', format: 'letter' })
    const margin = 40
    let y = 60

    doc.setFontSize(20)
    doc.text('Exam Result', margin, y)
    doc.setFontSize(12)
    y += 30
    doc.text(`Student: ${result.student.user.fullName}`, margin, y)
    y += 18
    doc.text(`Exam: ${result.exam.title}`, margin, y)
    y += 18
    doc.text(`Score: ${result.score}/${result.totalMarks}`, margin, y)
    y += 18
    doc.text(`Percentage: ${result.percentage.toFixed(2)}%`, margin, y)
    y += 18
    doc.text(`Grade: ${result.grade}`, margin, y)
    y += 24
    doc.text('Answer Breakdown:', margin, y)
    y += 18

    const answers = typeof result.answers === 'string' ? JSON.parse(result.answers) : result.answers
    answers.forEach((answer: any, index: number) => {
      const question = result.exam.questions.find((q: any) => q.id === answer.questionId)
      const selectedOption = question?.options?.find((o: any) => o.id === answer.selectedOptionId)
      doc.text(`${index + 1}. ${question?.content || 'Question not found'}`, margin, y)
      y += 16
      doc.text(`   Selected: ${selectedOption?.text || 'No answer'}`, margin, y)
      y += 16
      doc.text(`   Correct: ${answer.isCorrect ? 'Yes' : 'No'} — Marks: ${answer.marks}`, margin, y)
      y += 22
      if (y > 720) {
        doc.addPage()
        y = 60
      }
    })

    doc.save(`${result.exam.title}-result.pdf`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p>Loading result...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="max-w-xl rounded-3xl border border-red-700 bg-red-950/80 p-8 text-center">
          <p>{error}</p>
          <button
            onClick={() => safeNavigate(router, '/dashboard')}
            className="mt-6 rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg">Result not found for this exam.</p>
          <button
            onClick={() => safeNavigate(router, '/dashboard')}
            className="mt-6 rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/30">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Exam Result</p>
            <h1 className="text-4xl font-bold text-white mt-3">{result.exam.title}</h1>
            <p className="mt-2 text-slate-400">Student: {result.student.user.fullName}</p>
          </div>
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
          >
            Download PDF
          </button>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl bg-slate-950/80 p-6 border border-slate-800">
            <p className="text-sm text-slate-400">Score</p>
            <p className="mt-3 text-3xl font-semibold text-white">{result.score}/{result.totalMarks}</p>
          </div>
          <div className="rounded-3xl bg-slate-950/80 p-6 border border-slate-800">
            <p className="text-sm text-slate-400">Percentage</p>
            <p className="mt-3 text-3xl font-semibold text-white">{result.percentage.toFixed(2)}%</p>
          </div>
          <div className="rounded-3xl bg-slate-950/80 p-6 border border-slate-800">
            <p className="text-sm text-slate-400">Grade</p>
            <p className="mt-3 text-3xl font-semibold text-white">{result.grade}</p>
          </div>
        </div>

        <div className="mt-10 rounded-3xl bg-slate-950/80 p-6 border border-slate-800">
          <h2 className="text-xl font-semibold text-white mb-4">Answer Breakdown</h2>
          <div className="space-y-4">
            {result.exam.questions.map((question: any, index: number) => {
              const answer = (typeof result.answers === 'string' ? JSON.parse(result.answers) : result.answers).find((item: any) => item.questionId === question.id)
              const selectedOption = question.options?.find((opt: any) => opt.id === answer?.selectedOptionId)
              return (
                <div key={question.id} className="rounded-3xl bg-slate-900 p-4 border border-slate-800">
                  <p className="font-medium text-white">{index + 1}. {question.content}</p>
                  <p className="text-slate-400 mt-2">Selected: {selectedOption?.text || 'No answer'}</p>
                  <p className="text-slate-400">Correct: {answer?.isCorrect ? 'Yes' : 'No'}</p>
                  <p className="text-slate-400">Marks earned: {answer?.marks ?? 0}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
