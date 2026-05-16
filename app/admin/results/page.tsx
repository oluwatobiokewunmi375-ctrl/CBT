'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { safeNavigate } from '../../../lib/safeNavigate'
import toast from 'react-hot-toast'
import { Download, Printer, Eye, Loader2 } from 'lucide-react'

export default function AdminResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState<any[]>([])
  const [filteredResults, setFilteredResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selectedResult, setSelectedResult] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)

  // Filter states
  const [filters, setFilters] = useState({
    examId: '',
    classId: '',
    gradeFilter: '',
    search: ''
  })

  useEffect(() => {
    fetchResults()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [results, filters])

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        safeNavigate(router, '/login')
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

  const applyFilters = () => {
    let filtered = [...results]

    if (filters.examId) {
      filtered = filtered.filter(r => r.examId === filters.examId)
    }

    if (filters.classId) {
      filtered = filtered.filter(r => r.student?.classRoom?.id === filters.classId)
    }

    if (filters.gradeFilter) {
      filtered = filtered.filter(r => r.grade === filters.gradeFilter)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(r =>
        r.student?.user?.fullName?.toLowerCase().includes(searchLower) ||
        r.student?.studentNo?.includes(searchLower) ||
        r.exam?.title?.toLowerCase().includes(searchLower)
      )
    }

    setFilteredResults(filtered)
  }

  const handleExportCSV = async () => {
    try {
      setExporting(true)
      const csv = generateCSV(filteredResults)
      downloadFile(csv, 'results.csv', 'text/csv')
      toast.success('Results exported as CSV')
    } catch (err) {
      toast.error('Failed to export CSV')
    } finally {
      setExporting(false)
    }
  }

  const handlePrintResult = (result: any) => {
    const printWindow = window.open('', '', 'width=800,height=600')
    if (printWindow) {
      printWindow.document.write(generatePrintHTML(result))
      printWindow.document.close()
      printWindow.print()
    }
  }

  const generateCSV = (data: any[]) => {
    const headers = ['Student Name', 'Student ID', 'Exam', 'Score', 'Total Marks', 'Percentage', 'Grade', 'Status', 'Date']
    const rows = data.map(r => [
      r.student?.user?.fullName || 'N/A',
      r.student?.studentNo || 'N/A',
      r.exam?.title || 'N/A',
      r.score,
      r.totalMarks,
      r.percentage?.toFixed(2),
      r.grade,
      r.status,
      new Date(r.createdAt).toLocaleDateString()
    ])

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  }

  const generatePrintHTML = (result: any) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Result Sheet - ${result.student?.user?.fullName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .school-name { font-size: 24px; font-weight: bold; }
          .result-container { max-width: 800px; margin: 0 auto; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .grade-badge { padding: 8px 12px; border-radius: 4px; font-weight: bold; }
          .grade-a { background-color: #d4edda; color: #155724; }
          .grade-b { background-color: #cfe2ff; color: #084298; }
          .grade-c { background-color: #fff3cd; color: #664d03; }
          .grade-f { background-color: #f8d7da; color: #842029; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="result-container">
          <div class="header">
            <div class="school-name">${result.school?.name || 'School'}</div>
            <div style="color: #666; margin-top: 5px;">${result.school?.motto || ''}</div>
          </div>

          <h2 style="text-align: center; margin: 30px 0;">EXAMINATION RESULT SHEET</h2>

          <table>
            <tr>
              <th>Student Information</th>
              <th></th>
            </tr>
            <tr>
              <td><strong>Name:</strong></td>
              <td>${result.student?.user?.fullName || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Student ID:</strong></td>
              <td>${result.student?.studentNo || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Class:</strong></td>
              <td>${result.student?.classRoom?.name || 'N/A'}</td>
            </tr>
          </table>

          <table>
            <tr>
              <th>Examination Details</th>
              <th></th>
            </tr>
            <tr>
              <td><strong>Subject:</strong></td>
              <td>${result.exam?.subject?.name || result.exam?.title || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Score:</strong></td>
              <td>${result.score} / ${result.totalMarks}</td>
            </tr>
            <tr>
              <td><strong>Percentage:</strong></td>
              <td>${result.percentage?.toFixed(2)}%</td>
            </tr>
            <tr>
              <td><strong>Grade:</strong></td>
              <td><span class="grade-badge grade-${result.grade?.toLowerCase()}">${result.grade}</span></td>
            </tr>
            <tr>
              <td><strong>Status:</strong></td>
              <td>${result.status}</td>
            </tr>
            <tr>
              <td><strong>Time Taken:</strong></td>
              <td>${Math.floor(result.timeSpent / 60)} minutes</td>
            </tr>
          </table>

          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>This is an official examination result. Unauthorized reproduction is prohibited.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-white">Loading results...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📊 Results Management</h1>
          <p className="text-slate-400">View, filter, and export examination results</p>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search student or exam..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <select
              value={filters.gradeFilter}
              onChange={(e) => setFilters({ ...filters, gradeFilter: e.target.value })}
              className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All Grades</option>
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
              <option value="F">Grade F</option>
            </select>
            <button
              onClick={handleExportCSV}
              disabled={exporting || filteredResults.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export CSV
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-slate-400">
            Showing <span className="text-white font-bold">{filteredResults.length}</span> of <span className="text-white font-bold">{results.length}</span> results
          </p>
        </div>

        {/* Results Table */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl overflow-hidden">
          {filteredResults.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-400 text-lg">No results found matching your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50 border-b border-slate-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Student</th>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Exam</th>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Score</th>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Percentage</th>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Grade</th>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result, idx) => (
                    <tr key={result.id} className={idx % 2 === 0 ? 'bg-slate-700/20' : 'bg-slate-700/10'}>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{result.student?.user?.fullName || 'N/A'}</div>
                        <div className="text-slate-400 text-sm">{result.student?.studentNo || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 text-white">{result.exam?.title || 'N/A'}</td>
                      <td className="px-6 py-4 text-white font-semibold">{result.score} / {result.totalMarks}</td>
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
                      <td className="px-6 py-4 text-slate-400">{result.status}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedResult(result)
                            setShowModal(true)
                          }}
                          className="p-2 hover:bg-slate-600 rounded transition text-blue-400"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintResult(result)}
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
      {showModal && selectedResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Result Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Student Name</p>
                  <p className="text-white font-semibold">{selectedResult.student?.user?.fullName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Student ID</p>
                  <p className="text-white font-semibold">{selectedResult.student?.studentNo}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Exam</p>
                  <p className="text-white font-semibold">{selectedResult.exam?.title}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Class</p>
                  <p className="text-white font-semibold">{selectedResult.student?.classRoom?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Score</p>
                  <p className="text-white font-semibold">{selectedResult.score} / {selectedResult.totalMarks}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Percentage</p>
                  <p className="text-white font-semibold">{selectedResult.percentage?.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Grade</p>
                  <p className={`font-semibold ${
                    selectedResult.grade === 'A' ? 'text-green-400' :
                    selectedResult.grade === 'B' ? 'text-blue-400' :
                    selectedResult.grade === 'C' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {selectedResult.grade}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Time Taken</p>
                  <p className="text-white font-semibold">{Math.floor(selectedResult.timeSpent / 60)} minutes</p>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => handlePrintResult(selectedResult)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  <Printer className="w-4 h-4" />
                  Print Result
                </button>
                <button
                  onClick={() => setShowModal(false)}
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

