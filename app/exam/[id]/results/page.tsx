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
    const fetchResult = async () => {
      try {
        const res = await fetch(`/api/results/exam/${examId}`)

        if (res.status === 401) {
          safeNavigate(router, '/login')
          return
        }

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
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 30
    let y = margin

    // Title
    doc.setFontSize(24)
    doc.setFont(undefined, 'bold')
    doc.text('EXAM RESULT CARD', pageWidth / 2, y, { align: 'center' })
    y += 20

    // Student Info Box
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    const boxX = margin
    const boxY = y
    const colWidth = (pageWidth - 2 * margin) / 2
    
    doc.rect(boxX, boxY, colWidth, 16)
    doc.text('NAME:', boxX + 4, boxY + 12)
    doc.setFont(undefined, 'bold')
    doc.text(result.student.user.fullName, boxX + 60, boxY + 12)
    
    doc.setFont(undefined, 'normal')
    doc.rect(boxX + colWidth, boxY, colWidth, 16)
    doc.text('EXAM TITLE:', boxX + colWidth + 4, boxY + 12)
    doc.setFont(undefined, 'bold')
    doc.text(result.exam.title, boxX + colWidth + 60, boxY + 12)
    
    y += 20
    
    doc.setFont(undefined, 'normal')
    doc.rect(boxX, y, colWidth, 16)
    doc.text('STUDENT ID:', boxX + 4, y + 12)
    doc.setFont(undefined, 'bold')
    doc.text(result.student.studentNumber || 'N/A', boxX + 60, y + 12)
    
    doc.setFont(undefined, 'normal')
    doc.rect(boxX + colWidth, y, colWidth, 16)
    doc.text('DATE:', boxX + colWidth + 4, y + 12)
    doc.setFont(undefined, 'bold')
    doc.text(new Date().toLocaleDateString(), boxX + colWidth + 60, y + 12)
    
    y += 24

    // Score Summary Table
    doc.setFont(undefined, 'bold')
    doc.setFillColor(51, 51, 51)
    doc.setTextColor(255, 255, 255)
    
    const scoreColWidth = (pageWidth - 2 * margin) / 3
    const tableY = y
    
    doc.rect(margin, tableY, scoreColWidth, 14, 'F')
    doc.text('EXAM/SUBJECT', margin + 4, tableY + 10)
    
    doc.rect(margin + scoreColWidth, tableY, scoreColWidth, 14, 'F')
    doc.text('SCORE', margin + scoreColWidth + 4, tableY + 10)
    
    doc.rect(margin + 2 * scoreColWidth, tableY, scoreColWidth, 14, 'F')
    doc.text('GRADE', margin + 2 * scoreColWidth + 4, tableY + 10)
    
    y += 16
    
    doc.setTextColor(0, 0, 0)
    doc.setFont(undefined, 'normal')
    doc.rect(margin, y, scoreColWidth, 16)
    doc.text(result.exam.title, margin + 4, y + 10)
    
    doc.rect(margin + scoreColWidth, y, scoreColWidth, 16)
    doc.text(`${result.score}/${result.totalMarks}`, margin + scoreColWidth + 4, y + 10)
    
    doc.rect(margin + 2 * scoreColWidth, y, scoreColWidth, 16)
    doc.text(result.grade, margin + 2 * scoreColWidth + 4, y + 10)
    
    y += 24

    // Percentage and other details
    doc.setFont(undefined, 'bold')
    doc.text('Percentage:', margin, y)
    doc.setFont(undefined, 'normal')
    doc.text(`${result.percentage.toFixed(2)}%`, margin + 50, y)
    
    y += 16
    
    doc.setFont(undefined, 'bold')
    doc.text('Remarks:', margin, y)
    doc.setFont(undefined, 'normal')
    const performanceText = result.percentage >= 80 ? 'Excellent Performance' : 
                           result.percentage >= 60 ? 'Good Performance' : 
                           'Needs Improvement'
    doc.text(performanceText, margin + 50, y)
    
    y += 24

    // Answer Breakdown Table
    doc.setFont(undefined, 'bold')
    doc.setFontSize(11)
    doc.text('QUESTION BREAKDOWN', margin, y)
    y += 12

    // Parse answers
    let answers = typeof result.answers === 'string' ? JSON.parse(result.answers) : result.answers
    if (!Array.isArray(answers)) {
      answers = Object.values(answers || {})
    }

    // Table headers
    doc.setFontSize(9)
    doc.setFont(undefined, 'bold')
    doc.setFillColor(51, 51, 51)
    doc.setTextColor(255, 255, 255)
    
    const qNoWidth = 15
    const questionWidth = 85
    const answerWidth = 50
    const correctWidth = 30
    
    doc.rect(margin, y, qNoWidth, 12, 'F')
    doc.text('No.', margin + 2, y + 8)
    
    doc.rect(margin + qNoWidth, y, questionWidth, 12, 'F')
    doc.text('Question', margin + qNoWidth + 2, y + 8)
    
    doc.rect(margin + qNoWidth + questionWidth, y, answerWidth, 12, 'F')
    doc.text('Your Answer', margin + qNoWidth + questionWidth + 2, y + 8)
    
    doc.rect(margin + qNoWidth + questionWidth + answerWidth, y, correctWidth, 12, 'F')
    doc.text('Status', margin + qNoWidth + questionWidth + answerWidth + 2, y + 8)
    
    y += 14

    doc.setTextColor(0, 0, 0)
    doc.setFont(undefined, 'normal')

    answers.forEach((answer: any, index: number) => {
      if (y > pageHeight - margin) {
        doc.addPage()
        y = margin
      }

      const question = result.exam.questions.find((q: any) => q.id === answer.questionId)
      const selectedOption = question?.options?.find((o: any) => o.id === answer.selectedOptionId)
      const questionShort = question?.content?.substring(0, 30) + '...' || 'Question not found'
      const answerShort = (selectedOption?.text || 'No answer').substring(0, 20)
      const status = answer.isCorrect ? 'Correct' : 'Incorrect'
      
      doc.rect(margin, y, qNoWidth, 10)
      doc.text(`${index + 1}`, margin + 2, y + 7)
      
      doc.rect(margin + qNoWidth, y, questionWidth, 10)
      doc.text(questionShort, margin + qNoWidth + 2, y + 7)
      
      doc.rect(margin + qNoWidth + questionWidth, y, answerWidth, 10)
      doc.text(answerShort, margin + qNoWidth + questionWidth + 2, y + 7)
      
      doc.rect(margin + qNoWidth + questionWidth + answerWidth, y, correctWidth, 10)
      doc.setFont(undefined, answer.isCorrect ? 'bold' : 'normal')
      doc.setTextColor(
        answer.isCorrect ? 0 : 255,
        answer.isCorrect ? 128 : 0,
        answer.isCorrect ? 0 : 0
      )
      doc.text(status, margin + qNoWidth + questionWidth + answerWidth + 2, y + 7)
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, 'normal')
      
      y += 12
    })

    y += 10
    
    // Footer
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('This is an official exam result card. For inquiries, contact your school administrator.', pageWidth / 2, pageHeight - 15, { align: 'center' })

    doc.save(`${result.exam.title}-result-card.pdf`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <p className="text-slate-700 font-semibold">Loading result...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
        <div className="max-w-xl border-2 border-red-700 bg-red-100 p-8 text-center">
          <p className="text-red-900">{error}</p>
          <button
            onClick={() => safeNavigate(router, '/dashboard')}
            className="mt-6 border-2 border-slate-900 bg-white px-6 py-2 text-sm font-bold text-slate-900 hover:bg-slate-100"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-900">Result not found for this exam.</p>
          <button
            onClick={() => safeNavigate(router, '/dashboard')}
            className="mt-6 border-2 border-slate-900 bg-white px-6 py-2 text-sm font-bold text-slate-900 hover:bg-slate-100"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-amber-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto border-4 border-slate-900 bg-yellow-100 p-8 shadow-lg">
        {/* Title */}
        <h1 className="text-center text-3xl font-black text-slate-900 mb-1">EXAM RESULT CARD</h1>
        <p className="text-center text-xs font-semibold text-slate-700 mb-6">Official school exam result - CBT System</p>

        {/* Header Info */}
        <div className="grid grid-cols-2 gap-4 mb-6 border-2 border-slate-900">
          <div className="border-r-2 border-b-2 border-slate-900 p-3">
            <p className="text-xs font-bold text-slate-900">NAME:</p>
            <p className="text-sm font-bold text-slate-900">{result.student.user.fullName}</p>
          </div>
          <div className="border-b-2 border-slate-900 p-3">
            <p className="text-xs font-bold text-slate-900">EXAM TITLE:</p>
            <p className="text-sm font-bold text-slate-900">{result.exam.title}</p>
          </div>
          <div className="border-r-2 border-slate-900 p-3">
            <p className="text-xs font-bold text-slate-900">STUDENT ID:</p>
            <p className="text-sm font-bold text-slate-900">{result.student.studentNumber || 'N/A'}</p>
          </div>
          <div className="p-3">
            <p className="text-xs font-bold text-slate-900">DATE:</p>
            <p className="text-sm font-bold text-slate-900">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Score Summary Table */}
        <div className="mb-6 border-2 border-slate-900">
          <div className="grid grid-cols-3 gap-0 border-slate-900">
            <div className="border-r-2 border-b-2 border-slate-900 bg-slate-800 p-3">
              <p className="text-xs font-bold text-white">EXAM/SUBJECT</p>
            </div>
            <div className="border-r-2 border-b-2 border-slate-900 bg-slate-800 p-3">
              <p className="text-xs font-bold text-white">SCORE</p>
            </div>
            <div className="border-b-2 border-slate-900 bg-slate-800 p-3">
              <p className="text-xs font-bold text-white">GRADE</p>
            </div>
            
            <div className="border-r-2 border-slate-900 p-3">
              <p className="text-sm font-semibold text-slate-900">{result.exam.title}</p>
            </div>
            <div className="border-r-2 border-slate-900 p-3">
              <p className="text-sm font-bold text-slate-900">{result.score}/{result.totalMarks}</p>
            </div>
            <div className="p-3">
              <p className="text-sm font-bold text-slate-900">{result.grade}</p>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="grid grid-cols-2 gap-4 mb-6 border-2 border-slate-900">
          <div className="border-r-2 border-b-2 border-slate-900 p-3">
            <p className="text-xs font-bold text-slate-900">PERCENTAGE:</p>
            <p className="text-sm font-bold text-slate-900">{result.percentage.toFixed(2)}%</p>
          </div>
          <div className="border-b-2 border-slate-900 p-3">
            <p className="text-xs font-bold text-slate-900">PERFORMANCE:</p>
            <p className="text-sm font-bold text-slate-900">
              {result.percentage >= 80 ? 'Excellent' : result.percentage >= 60 ? 'Good' : 'Needs Improvement'}
            </p>
          </div>
          <div className="border-r-2 border-slate-900 p-3">
            <p className="text-xs font-bold text-slate-900">TOTAL QUESTIONS:</p>
            <p className="text-sm font-bold text-slate-900">{result.exam.questions?.length ?? 0}</p>
          </div>
          <div className="p-3">
            <p className="text-xs font-bold text-slate-900">QUESTIONS CORRECT:</p>
            <p className="text-sm font-bold text-slate-900">
              {result.answers ? (Array.isArray(result.answers) ? result.answers : Object.values(result.answers || {})).filter((a: any) => a.isCorrect).length : 0}
            </p>
          </div>
        </div>

        {/* Answer Breakdown Table */}
        <div className="mb-6">
          <h2 className="text-sm font-black text-slate-900 mb-2 bg-slate-800 text-white p-2">ANSWER BREAKDOWN</h2>
          <div className="overflow-x-auto border-2 border-slate-900">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-800">
                  <th className="border border-slate-900 p-2 text-white text-xs font-bold">NO.</th>
                  <th className="border border-slate-900 p-2 text-white text-xs font-bold">QUESTION</th>
                  <th className="border border-slate-900 p-2 text-white text-xs font-bold">YOUR ANSWER</th>
                  <th className="border border-slate-900 p-2 text-white text-xs font-bold">STATUS</th>
                  <th className="border border-slate-900 p-2 text-white text-xs font-bold">MARKS</th>
                </tr>
              </thead>
              <tbody>
                {result.exam.questions.map((question: any, index: number) => {
                  let answerData = result.answers
                  if (typeof answerData === 'string') {
                    try {
                      answerData = JSON.parse(answerData)
                    } catch (error) {
                      answerData = []
                    }
                  }

                  const answerList = Array.isArray(answerData) ? answerData : Object.values(answerData || {})
                  const answer = answerList.find((item: any) => item.questionId === question.id)
                  const selectedOption = question.options?.find((opt: any) => opt.id === answer?.selectedOptionId)
                  
                  return (
                    <tr key={question.id} className={index % 2 === 0 ? 'bg-yellow-50' : 'bg-white'}>
                      <td className="border border-slate-900 p-2 text-xs font-bold text-slate-900 text-center">{index + 1}</td>
                      <td className="border border-slate-900 p-2 text-xs text-slate-900">{question.content?.substring(0, 40)}...</td>
                      <td className="border border-slate-900 p-2 text-xs text-slate-900">{selectedOption?.text || 'No answer'}</td>
                      <td className={`border border-slate-900 p-2 text-xs font-bold text-center ${answer?.isCorrect ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'}`}>
                        {answer?.isCorrect ? 'CORRECT' : 'INCORRECT'}
                      </td>
                      <td className="border border-slate-900 p-2 text-xs font-bold text-center text-slate-900">{answer?.marks ?? 0}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Download Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleDownloadPdf}
            className="border-2 border-slate-900 bg-slate-900 px-8 py-3 font-bold text-white hover:bg-slate-800 text-sm"
          >
            DOWNLOAD PDF REPORT CARD
          </button>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-slate-900 pt-4 text-center text-xs text-slate-700">
          <p className="font-semibold">www.examcbt.com</p>
          <p>This is an official exam result card. For inquiries, contact your school administrator.</p>
        </div>
      </div>
    </div>
  )
}
