"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { safeNavigate } from "@/lib/safeNavigate"
import toast from "react-hot-toast"
import { Trash2, Pencil, Plus, Upload, Loader2, Download, FileText, File, FileSpreadsheet, FileJson } from "lucide-react"
import { parseFile, CSV_TEMPLATE, validateQuestions, type ParsedQuestion } from "@/lib/fileParser"

export default function AdminQuestionsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialExamId = searchParams.get("examId") || ""

  const [questions, setQuestions] = useState<any[]>([])
  const [exams, setExams] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, totalMarks: 0 })
  const [loading, setLoading] = useState(true)
  const [examFilter, setExamFilter] = useState(initialExamId)
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [importExamId, setImportExamId] = useState(initialExamId)
  const [csvText, setCsvText] = useState("")
  const [importing, setImporting] = useState(false)
  const [importMethod, setImportMethod] = useState<"paste" | "upload">("paste")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewQuestions, setPreviewQuestions] = useState<ParsedQuestion[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const [formData, setFormData] = useState({
    examId: initialExamId,
    content: "",
    marks: 1,
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "A",
  })

  const fetchQuestions = useCallback(async () => {
    try {
      const url = examFilter
        ? `/api/admin/questions?examId=${examFilter}`
        : "/api/admin/questions"
      const res = await fetch(url)
      if (res.status === 401) return safeNavigate(router, "/login")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load")
      setQuestions(data.questions || [])
      setStats(data.stats || { total: 0, totalMarks: 0 })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Load failed")
    } finally {
      setLoading(false)
    }
  }, [examFilter, router])

  useEffect(() => {
    setLoading(true)
    fetchQuestions()
    fetch("/api/admin/exams")
      .then((r) => r.json())
      .then((d) => setExams(d.exams || []))
      .catch(() => {})
  }, [fetchQuestions])

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return questions
    return questions.filter(
      (item) =>
        item.content?.toLowerCase().includes(q) ||
        item.exam?.title?.toLowerCase().includes(q)
    )
  }, [questions, searchTerm])

  const resetForm = () => {
    setFormData({
      examId: examFilter || "",
      content: "",
      marks: 1,
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "A",
    })
    setEditingId(null)
  }

  const openEdit = (q: any) => {
    setEditingId(q.id)
    setFormData({
      examId: q.examId,
      content: q.content,
      marks: q.marks || 1,
      optionA: q.optionA || "",
      optionB: q.optionB || "",
      optionC: q.optionC || "",
      optionD: q.optionD || "",
      correctAnswer: q.correctAnswer || "A",
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingId ? `/api/admin/questions/${editingId}` : "/api/admin/questions"
      const method = editingId ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Save failed")
      toast.success(editingId ? "Question updated" : "Question created")
      setShowForm(false)
      resetForm()
      fetchQuestions()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question?")) return
    try {
      const res = await fetch(`/api/admin/questions/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Delete failed")
      }
      toast.success("Deleted")
      fetchQuestions()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    }
  }

  const handleBulkImport = async () => {
    if (!importExamId) {
      toast.error("Select an exam for import")
      return
    }

    let questionsToImport: ParsedQuestion[] = []

    if (importMethod === "paste") {
      if (!csvText.trim()) {
        toast.error("Paste content or select a file")
        return
      }
      questionsToImport = previewQuestions.length > 0 ? previewQuestions : []
    } else {
      if (!uploadedFile) {
        toast.error("Select a file to upload")
        return
      }
      questionsToImport = previewQuestions
    }

    if (questionsToImport.length === 0) {
      toast.error("No valid questions found")
      return
    }

    setImporting(true)
    try {
      const res = await fetch("/api/admin/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: importExamId,
          csv: questionsToImport
            .map(
              (q) =>
                `"${q.content}","${q.optionA}","${q.optionB}","${q.optionC}","${q.optionD}","${q.correctAnswer}",${q.marks}`
            )
            .join("\n"),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        const details = data.details?.join?.("; ") || data.error
        throw new Error(details || "Import failed")
      }
      toast.success(data.message || `Imported ${data.imported} questions`)
      setShowImport(false)
      setCsvText("")
      setUploadedFile(null)
      setPreviewQuestions([])
      setImportMethod("paste")
      setExamFilter(importExamId)
      fetchQuestions()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed")
    } finally {
      setImporting(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      setUploadedFile(file)
      const questions = await parseFile(file)
      const validation = validateQuestions(questions)

      if (!validation.valid) {
        toast.error(`File has issues:\n${validation.errors.slice(0, 3).join("\n")}`)
        setPreviewQuestions(questions.slice(0, 10))
        return
      }

      setPreviewQuestions(questions)
      toast.success(`Found ${questions.length} valid questions`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "File parsing failed")
      setUploadedFile(null)
      setPreviewQuestions([])
    }
  }

  const handlePasteContent = () => {
    if (!csvText.trim()) {
      toast.error("Paste content first")
      return
    }
    try {
      parseFile(new File([csvText], "pasted.csv", { type: "text/csv" }))
        .then((questions) => {
          const validation = validateQuestions(questions)

          if (!validation.valid) {
            toast.error(`Content has issues:\n${validation.errors.slice(0, 3).join("\n")}`)
            setPreviewQuestions(questions.slice(0, 10))
            return
          }

          setPreviewQuestions(questions)
          toast.success(`Found ${questions.length} valid questions`)
        })
        .catch((err) => {
          toast.error(err.message || "Failed to parse content")
        })
    } catch (err) {
      toast.error("Failed to parse content")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm uppercase tracking-wider text-cyan-400/80">Exam content</p>
            <h1 className="text-4xl font-bold mt-1">Question bank</h1>
            <p className="text-slate-400 mt-2">MCQ builder with auto-grading options (A–D).</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/exams" className="text-sm text-slate-400 hover:text-white px-3 py-2">
              ← Exams
            </Link>
            <button
              onClick={() => {
                setShowImport(true)
                setImportExamId(examFilter || "")
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-600 text-sm hover:border-slate-500"
            >
              <Upload className="h-4 w-4" /> Bulk import
            </button>
            <button
              onClick={() => {
                resetForm()
                setFormData((f) => ({ ...f, examId: examFilter || "" }))
                setShowForm(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500 text-slate-950 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" /> New question
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <p className="text-slate-400 text-sm">Questions</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <p className="text-slate-400 text-sm">Total marks</p>
            <p className="text-3xl font-bold text-green-400">{stats.totalMarks}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <select
            value={examFilter}
            onChange={(e) => {
              setExamFilter(e.target.value)
              setLoading(true)
            }}
            className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm max-w-xs"
          >
            <option value="">All exams</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title} ({ex.status})
              </option>
            ))}
          </select>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions…"
            className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-12 text-center text-slate-400">
              No questions found. Create one or import from CSV.
            </div>
          ) : (
            filtered.map((q) => (
              <div
                key={q.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5"
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                        {q.marks} mark{q.marks !== 1 ? "s" : ""}
                      </span>
                      <span className="text-slate-500">{q.exam?.title}</span>
                    </div>
                    <p className="font-medium text-lg">{q.content}</p>
                    <div className="mt-3 grid sm:grid-cols-2 gap-1 text-sm text-slate-400">
                      {["A", "B", "C", "D"].map((letter) => (
                        <div
                          key={letter}
                          className={
                            q.correctAnswer === letter
                              ? "text-green-400 font-semibold"
                              : ""
                          }
                        >
                          {letter}) {q[`option${letter}` as "optionA"]}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => openEdit(q)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-2 rounded-lg bg-red-600/80 hover:bg-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 my-8">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? "Edit question" : "New question"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select
                required
                value={formData.examId}
                onChange={(e) => setFormData({ ...formData, examId: e.target.value })}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2"
                disabled={!!editingId}
              >
                <option value="">Select exam</option>
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title}
                  </option>
                ))}
              </select>
              <textarea
                required
                rows={3}
                placeholder="Question text"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2"
              />
              <input
                type="number"
                min={1}
                value={formData.marks}
                onChange={(e) =>
                  setFormData({ ...formData, marks: parseInt(e.target.value, 10) || 1 })
                }
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2"
              />
              {(["A", "B", "C", "D"] as const).map((letter) => (
                <input
                  key={letter}
                  required
                  placeholder={`Option ${letter}`}
                  value={formData[`option${letter}`]}
                  onChange={(e) =>
                    setFormData({ ...formData, [`option${letter}`]: e.target.value })
                  }
                  className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2"
                />
              ))}
              <select
                value={formData.correctAnswer}
                onChange={(e) =>
                  setFormData({ ...formData, correctAnswer: e.target.value })
                }
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2"
              >
                {["A", "B", "C", "D"].map((l) => (
                  <option key={l} value={l}>
                    Correct: {l}
                  </option>
                ))}
              </select>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                  className="flex-1 py-2 rounded-lg bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Bulk import questions</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Supports CSV, Excel, PDF, and Word documents
                </p>
              </div>
              <button
                onClick={() => {
                  setShowImport(false)
                  setCsvText("")
                  setUploadedFile(null)
                  setPreviewQuestions([])
                  setImportMethod("paste")
                }}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Step 1: Select Import Method */}
            {previewQuestions.length === 0 && (
              <>
                <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p className="text-sm text-slate-300 mb-4">Choose import method:</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setImportMethod("paste")}
                      className={`p-4 rounded-lg border-2 transition text-left ${
                        importMethod === "paste"
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-slate-600 bg-slate-800 hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-cyan-400" />
                        <span className="font-semibold">Paste Content</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Paste CSV-formatted text directly
                      </p>
                    </button>
                    <button
                      onClick={() => setImportMethod("upload")}
                      className={`p-4 rounded-lg border-2 transition text-left ${
                        importMethod === "upload"
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-slate-600 bg-slate-800 hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Upload className="h-5 w-5 text-cyan-400" />
                        <span className="font-semibold">Upload File</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        CSV, Excel, PDF, or Word document
                      </p>
                    </button>
                  </div>
                </div>

                {/* Select Exam */}
                <select
                  value={importExamId}
                  onChange={(e) => setImportExamId(e.target.value)}
                  className="w-full mb-6 rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm"
                >
                  <option value="">Select target exam *</option>
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title}
                    </option>
                  ))}
                </select>

                {/* Paste Method */}
                {importMethod === "paste" && (
                  <div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Paste CSV content:</label>
                        <button
                          type="button"
                          onClick={() => {
                            const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" })
                            const a = document.createElement("a")
                            a.href = URL.createObjectURL(blob)
                            a.download = "cbt-questions-template.csv"
                            a.click()
                          }}
                          className="inline-flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300"
                        >
                          <Download className="h-3 w-3" /> Download CSV template
                        </button>
                      </div>
                      <textarea
                        value={csvText}
                        onChange={(e) => setCsvText(e.target.value)}
                        rows={8}
                        placeholder={`Paste CSV content here...\nExample:\ncontent,optionA,optionB,optionC,optionD,correctAnswer,marks\n"Question?","A","B","C","D","B",1`}
                        className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 font-mono text-xs text-slate-100 placeholder-slate-500"
                      />
                      <p className="text-xs text-slate-400 mt-2">
                        Format: content, optionA, optionB, optionC, optionD, correctAnswer (A-D), marks (1+)
                      </p>
                    </div>
                    <button
                      onClick={handlePasteContent}
                      disabled={!csvText.trim()}
                      className="w-full py-2 rounded-lg bg-blue-600 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                    >
                      Preview from Paste
                    </button>
                  </div>
                )}

                {/* Upload Method */}
                {importMethod === "upload" && (
                  <div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-3">
                        Select file from your computer:
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls,.pdf,.docx,.doc,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleFileUpload(e.target.files[0])
                            }
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-slate-800 border-2 border-dashed border-slate-600 text-sm cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-cyan-500 file:text-slate-950 file:font-semibold hover:border-slate-500"
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        Supported: CSV • Excel (XLSX, XLS) • PDF • Word (DOCX, DOC)
                      </p>
                      {uploadedFile && (
                        <div className="mt-3 p-2 bg-green-500/10 border border-green-600/30 rounded text-sm text-green-400">
                          ✓ {uploadedFile.name}
                        </div>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-800/50 rounded text-xs text-slate-400">
                        <div className="font-semibold text-slate-300 mb-2 flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" /> Excel Format
                        </div>
                        <p>Columns: content, optionA, optionB, optionC, optionD, correctAnswer, marks</p>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded text-xs text-slate-400">
                        <div className="font-semibold text-slate-300 mb-2 flex items-center gap-2">
                          <FileJson className="h-4 w-4" /> CSV Format
                        </div>
                        <p>Same columns with comma separation and quoted values</p>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded text-xs text-slate-400">
                        <div className="font-semibold text-slate-300 mb-2 flex items-center gap-2">
                          <File className="h-4 w-4" /> PDF Format
                        </div>
                        <p>Extract content + options (A, B, C, D) + correct answer</p>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded text-xs text-slate-400">
                        <div className="font-semibold text-slate-300 mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" /> Word Format
                        </div>
                        <p>Text extraction from DOCX files with parsing</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Step 2: Preview Questions */}
            {previewQuestions.length > 0 && (
              <>
                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-600/30 rounded-lg">
                  <p className="text-sm text-blue-300">
                    <span className="font-semibold">{previewQuestions.length} questions</span> ready to import
                  </p>
                </div>

                <div className="max-h-[40vh] overflow-y-auto mb-6 space-y-3">
                  {previewQuestions.slice(0, 5).map((q, idx) => (
                    <div key={idx} className="p-3 bg-slate-800/50 border border-slate-700 rounded text-sm">
                      <p className="font-medium text-white mb-1">
                        {idx + 1}. {q.content.substring(0, 60)}...
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                        <div>A) {q.optionA.substring(0, 25)}</div>
                        <div>B) {q.optionB.substring(0, 25)}</div>
                        <div>C) {q.optionC.substring(0, 25)}</div>
                        <div>D) {q.optionD.substring(0, 25)}</div>
                      </div>
                      <p className="text-xs text-green-400 mt-1">
                        Correct: {q.correctAnswer} • Marks: {q.marks}
                      </p>
                    </div>
                  ))}
                  {previewQuestions.length > 5 && (
                    <p className="text-xs text-slate-500 text-center py-2">
                      +{previewQuestions.length - 5} more questions...
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              {previewQuestions.length > 0 ? (
                <>
                  <button
                    onClick={() => {
                      setPreviewQuestions([])
                      setCsvText("")
                      setUploadedFile(null)
                    }}
                    className="flex-1 py-2 rounded-lg bg-slate-700 font-semibold text-sm hover:bg-slate-600"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleBulkImport}
                    disabled={importing || !importExamId}
                    className="flex-1 py-2 rounded-lg bg-green-600 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" /> Import {previewQuestions.length} Questions
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setShowImport(false)
                    setCsvText("")
                    setUploadedFile(null)
                  }}
                  className="w-full py-2 rounded-lg bg-slate-700 font-semibold text-sm hover:bg-slate-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
