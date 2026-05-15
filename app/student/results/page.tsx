'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Download, Printer, Loader2, TrendingUp } from 'lucide-react'

export default function StudentResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedResult, setSelectedResult] = useState<any>(null)

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch('/api/results/list', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setResults(data.results || [])
      } else {
        toast.error('Failed to load results')
      }
    } catch (err) {
      console.error('Error fetching results:', err)
      toast.error('Error loading results')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = (result: any) => {
    const printWindow = window.open('', '', 'width=800,height=600')
    if (printWindow) {
      printWindow.document.write(generatePrintHTML(result))
      printWindow.document.close()
      printWindow.print()
    }
  }

  const generatePrintHTML = (result: any) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>My Result - ${result.exam?.title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #007bff; padding-bottom: 20px; }
          .school-name { font-size: 20px; font-weight: bold; color: #333; }
          .result-title { font-size: 24px; font-weight: bold; color: #007bff; margin: 20px 0; }
          .result-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
          .result-item { padding: 15px; background: #f9f9f9; border-radius: 4px; }
          .result-label { font-size: 12px; color: #666; text-transform: uppercase; }
          .result-value { font-size: 28px; font-weight: bold; color: #007bff; margin-top: 5px; }
          .grade { font-size: 48px; font-weight: bold; text-align: center; color: #28a745; }
          .remarks { margin-top: 30px; padding: 20px; background: #e3f2fd; border-left: 4px solid #007bff; border-radius: 4px; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="school-name">${result.school?.name || 'School'}</div>
            <div class="result-title">Examination Result</div>
          </div>

          <h3>${result.exam?.title}</h3>
          <p style="color: #666; margin: 5px 0;">Date: ${new Date(result.createdAt).toLocaleDateString()}</p>

          <div class="result-grid">
            <div class="result-item">
              <div class="result-label">Your Score</div>
              <div class="result-value">${result.score}/${result.totalMarks}</div>
            </div>
            <div class="result-item">
              <div class="result-label">Percentage</div>
              <div class="result-value">${result.percentage?.toFixed(1)}%</div>
            </div>
          </div>

          <div style="text-align: center;">
            <div class="result-label" style="margin-bottom: 10px;">Your Grade</div>
            <div class="grade">${result.grade}</div>
          </div>

          <div class="remarks">
            <h4 style="margin-top: 0;">Performance Summary</h4>
            <p>
              Your performance on this examination indicates a 
              ${result.percentage >= 80 ? 'excellent' : result.percentage >= 70 ? 'good' : result.percentage >= 60 ? 'satisfactory' : 'needs improvement'}
              understanding of the material. Keep up your hard work!
            </p>
            <p><strong>Time Spent:</strong> ${Math.floor(result.timeSpent / 60)} minutes</p>
          </div>

          <div class="footer">
            <p>This is your official examination result. Please keep this for your records.</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
      </div>
    )
  }

  const stats = {
    total: results.length,
    passed: results.filter((r: any) => r.percentage >= 50).length,
    average: results.length > 0 ? (results.reduce((sum: number, r: any) => sum + r.percentage, 0) / results.length).toFixed(1) : 0,
    bestGrade: results.length > 0 ? results.reduce((best: any, r: any) => (r.percentage > best.percentage ? r : best)).grade : 'N/A'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📈 My Results</h1>
          <p className="text-slate-400">View your examination results and performance</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
            <p className="text-slate-400 text-sm">Total Exams</p>
            <p className="text-4xl font-bold text-white mt-2">{stats.total}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
            <p className="text-slate-400 text-sm">Passed</p>
            <p className="text-4xl font-bold text-green-400 mt-2">{stats.passed}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
            <p className="text-slate-400 text-sm">Average Score</p>
            <p className="text-4xl font-bold text-blue-400 mt-2">{stats.average}%</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6">
            <p className="text-slate-400 text-sm">Best Grade</p>
            <p className="text-4xl font-bold text-amber-400 mt-2">{stats.bestGrade}</p>
          </div>
        </div>

        {/* Results List */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl overflow-hidden">
          {results.length === 0 ? (
            <div className="p-12 text-center">
              <TrendingUp className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No results yet</p>
              <p className="text-slate-500">Your exam results will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50 border-b border-slate-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Exam</th>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Date</th>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Score</th>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Percentage</th>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Grade</th>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, idx) => (
                    <tr key={result.id} className={idx % 2 === 0 ? 'bg-slate-700/20' : 'bg-slate-700/10'}>
                      <td className="px-6 py-4 text-white font-medium">{result.exam?.title}</td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(result.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-white font-semibold">{result.score}/{result.totalMarks}</td>
                      <td className="px-6 py-4 text-white">{result.percentage?.toFixed(2)}%</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          result.grade === 'A' ? 'bg-green-500/20 text-green-400' :
                          result.grade === 'B' ? 'bg-blue-500/20 text-blue-400' :
                          result.grade === 'C' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {result.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => setSelectedResult(result)}
                          className="p-2 hover:bg-slate-600 rounded transition text-blue-400"
                          title="View Details"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => handlePrint(result)}
                          className="p-2 hover:bg-slate-600 rounded transition text-green-400"
                          title="Print"
                        >
                          <Printer className="w-4 h-4" />
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

      {/* Detail Modal */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">{selectedResult.exam?.title}</h2>
              <button
                onClick={() => setSelectedResult(null)}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Score Display */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-8 text-center">
                <p className="text-white/80 mb-2">Your Score</p>
                <p className="text-5xl font-bold text-white mb-4">
                  {selectedResult.score}/{selectedResult.totalMarks}
                </p>
                <p className="text-white/90 text-xl">{selectedResult.percentage?.toFixed(2)}%</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">Grade</p>
                  <p className={`text-2xl font-bold ${
                    selectedResult.grade === 'A' ? 'text-green-400' :
                    selectedResult.grade === 'B' ? 'text-blue-400' :
                    selectedResult.grade === 'C' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {selectedResult.grade}
                  </p>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">Status</p>
                  <p className="text-white font-semibold">{selectedResult.status}</p>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">Time Taken</p>
                  <p className="text-white font-semibold">{Math.floor(selectedResult.timeSpent / 60)} minutes</p>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">Date</p>
                  <p className="text-white font-semibold">
                    {new Date(selectedResult.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Performance Remark */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-2">Performance</p>
                <p className="text-white">
                  {selectedResult.percentage >= 80 && 'Excellent performance! Keep it up! 🎉'}
                  {selectedResult.percentage >= 70 && selectedResult.percentage < 80 && 'Good performance! You can do better! 👍'}
                  {selectedResult.percentage >= 60 && selectedResult.percentage < 70 && 'Satisfactory performance. Review the material. 📚'}
                  {selectedResult.percentage < 60 && 'Needs improvement. Focus on weak areas. 💪'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handlePrint(selectedResult)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  <Printer className="w-4 h-4" />
                  Print Result
                </button>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
