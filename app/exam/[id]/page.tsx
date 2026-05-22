"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { safeNavigate } from '@/lib/safeNavigate'
import toast from 'react-hot-toast'
import OfflineExamRunner from '@/components/exam/OfflineExamRunner'
import { useOfflineStatus } from '@/lib/hooks/useOfflineStatus'
import {
  useExamReliability,
  getReliabilityMessage,
  isExamPlayable,
} from '@/hooks/useExamReliability'
import {
  ExamHeader,
  ExamNav,
  QuestionCard,
  ExamFooter,
} from '@/components/exam/exam-components'
import { Card, Skeleton } from '@/components/ui/design-system'

const OWNER_TAB_STORAGE_KEY = 'cbt_exam_owner_tab_id'

export default function ExamPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  const { isOffline } = useOfflineStatus()

  const [exam, setExam] = useState<any>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [sessionVersion, setSessionVersion] = useState<number>(1)
  const [ownerTabId, setOwnerTabId] = useState<string>('')
  const [submitted, setSubmitted] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const startSessionInProgressRef = useRef(false)

  const {
    state: reliabilityState,
    trackAutosave,
    setOfflineStatus,
    setRestoring,
    setGraceWindow,
    setCriticalError,
  } = useExamReliability({
    onAutosaveConflict: () => {
      toast.error('A save conflict was detected. Your answers are being synchronized.')
    },
    onOwnershipLost: () => {
      toast.error('Another tab took over this exam. This tab is now read-only.')
    },
    onSessionExpired: () => {
      toast.error('Your exam session has expired.')
    },
    onCriticalError: (message) => {
      toast.error(message)
    },
  })

  const questionCount = exam?.questions?.length ?? 0
  const safeQuestionIndex = Math.min(Math.max(currentQuestion, 0), questionCount - 1)
  const question = exam?.questions?.[safeQuestionIndex]

  const answeredQuestions = useMemo(
    () =>
      exam?.questions?.reduce((acc: Record<number, boolean>, item: any, index: number) => {
        acc[index] = Boolean(answers[item.id])
        return acc
      }, {}) || {},
    [exam, answers]
  )

  const answeredCount = Object.values(answeredQuestions).filter(Boolean).length

  const setOwnerTabIfAbsent = useCallback(() => {
    if (typeof window === 'undefined') return

    let storedTabId = sessionStorage.getItem(OWNER_TAB_STORAGE_KEY)
    if (!storedTabId) {
      storedTabId = crypto.randomUUID()
      sessionStorage.setItem(OWNER_TAB_STORAGE_KEY, storedTabId)
    }
    setOwnerTabId(storedTabId)
  }, [])

  const syncSessionState = useCallback(
    (sessionData: any, examData: any) => {
      if (!sessionData) return

      setSessionId(sessionData.id ?? null)
      setAnswers(sessionData.answersJson?.answers || {})

      const questionId = sessionData.answersJson?.currentQuestionId
      const index = examData?.questions?.findIndex((q: any) => q.id === questionId)
      setCurrentQuestion(index >= 0 ? index : 0)
      setSessionVersion(sessionData.version ?? 1)

      if (sessionData.expiresAt) {
        const expiresAt = new Date(sessionData.expiresAt)
        const remainingSeconds = Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 1000))
        setTimeLeft(remainingSeconds)

        const gracePeriodMs = 10 * 1000
        const timeRemainingMs = expiresAt.getTime() - Date.now()
        if (timeRemainingMs < 0) {
          setCriticalError('Session expired')
        } else if (timeRemainingMs < gracePeriodMs) {
          setGraceWindow(true, Math.round(timeRemainingMs / 1000))
        }
      } else if (examData?.duration) {
        setTimeLeft(examData.duration * 60)
      }

      setRestoring(false)
    },
    [setCriticalError, setGraceWindow, setRestoring]
  )

  const fetchExam = useCallback(async () => {
    setRestoring(true)
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/exam/${examId}`)
      if (res.status === 401) {
        safeNavigate(router, '/login')
        return
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to load exam')
      }

      const data = await res.json()
      setExam(data.exam)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading exam')
    } finally {
      setLoading(false)
      setRestoring(false)
    }
  }, [examId, router, setRestoring])

  const startSession = useCallback(async () => {
    if (!examId || !exam) return

    setRestoring(true)

    try {
      const res = await fetch('/api/exam/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          ipAddress: window.location.hostname,
          deviceInfo: navigator.userAgent,
          ownerTabId: ownerTabId || undefined,
        }),
      })

      if (res.status === 401) {
        safeNavigate(router, '/login')
        return
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Unable to start exam session')
      }

      const data = await res.json()
      syncSessionState(data.session, exam)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to start exam session'
      setError(message)
      toast.error(message)
      setCriticalError(message)
    } finally {
      setRestoring(false)
    }
  }, [exam, examId, ownerTabId, router, setCriticalError, setRestoring, syncSessionState])

  const saveProgress = useCallback(
    async (currentQuestionId?: string, answersPayload?: Record<string, string>) => {
      if (!sessionId) return
      setIsSaving(true)
      trackAutosave('saving')
      try {
        const res = await fetch('/api/exam/save-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            answers: answersPayload || answers,
            currentQuestionId,
            clientUpdatedAt: Date.now(),
            sessionVersion,
            ownerTabId: ownerTabId || undefined,
          }),
        })

        if (res.status === 401) {
          safeNavigate(router, '/login')
          return
        }

        if (res.status === 409) {
          const data = await res.json()
          if (data.currentVersion) {
            setSessionVersion(data.currentVersion)
          }
          trackAutosave('conflict')
          return
        }

        if (res.ok) {
          const data = await res.json()
          setSessionVersion(data.session?.version ?? sessionVersion)
          trackAutosave('saved')
        }
      } catch (err) {
        trackAutosave('error', err instanceof Error ? err.message : 'Save failed')
        console.warn('Progress save failed:', err)
      } finally {
        setIsSaving(false)
      }
    },
    [answers, ownerTabId, router, sessionId, sessionVersion, trackAutosave]
  )

  const handleAnswerSelect = useCallback(
    async (optionId: string) => {
      if (!question) return
      const nextAnswers = { ...answers, [question.id]: optionId }
      setAnswers(nextAnswers)
      await saveProgress(question.id, nextAnswers)
    },
    [answers, question, saveProgress]
  )

  const handleNavigateQuestion = useCallback(
    async (index: number) => {
      if (!exam?.questions?.[index]) return
      setCurrentQuestion(index)
      await saveProgress(exam.questions[index].id)
      setMobileMenuOpen(false)
    },
    [exam, saveProgress]
  )

  const handlePrevious = useCallback(async () => {
    if (safeQuestionIndex <= 0 || !exam?.questions?.[safeQuestionIndex - 1]) return
    const nextQuestionId = exam.questions[safeQuestionIndex - 1].id
    setCurrentQuestion(safeQuestionIndex - 1)
    await saveProgress(nextQuestionId)
  }, [exam, safeQuestionIndex, saveProgress])

  const handleNext = useCallback(async () => {
    if (safeQuestionIndex >= questionCount - 1 || !exam?.questions?.[safeQuestionIndex + 1]) return
    const nextQuestionId = exam.questions[safeQuestionIndex + 1].id
    setCurrentQuestion(safeQuestionIndex + 1)
    await saveProgress(nextQuestionId)
  }, [exam, questionCount, safeQuestionIndex, saveProgress])

  const handleSubmit = useCallback(async () => {
    if (!exam || !sessionId) return
    setIsSubmitting(true)

    try {
      const formattedAnswers: Record<string, string> = {}
      exam.questions.forEach((q: any) => {
        formattedAnswers[q.id] = answers[q.id] || ''
      })

      const res = await fetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          answers: formattedAnswers,
          timeSpent: (exam.duration * 60 - (timeLeft || 0)) / 60,
          sessionId,
          ownerTabId: ownerTabId || undefined,
        }),
      })

      if (res.status === 401) {
        safeNavigate(router, '/login')
        return
      }

      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to submit exam')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error submitting exam')
    } finally {
      setIsSubmitting(false)
    }
  }, [answers, exam, examId, ownerTabId, router, sessionId, timeLeft])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setOwnerTabIfAbsent()
  }, [setOwnerTabIfAbsent])

  useEffect(() => {
    fetchExam()
  }, [fetchExam])

  useEffect(() => {
    if (!exam || sessionId || startSessionInProgressRef.current) {
      return
    }

    if (!ownerTabId) {
      return
    }

    startSessionInProgressRef.current = true
    startSession().finally(() => {
      startSessionInProgressRef.current = false
    })
  }, [exam, ownerTabId, sessionId, startSession])

  useEffect(() => {
    if (!exam || !sessionId) return

    if (!timeLeft || timeLeft <= 0 || submitted) return

    const timer = window.setInterval(() => {
      setTimeLeft((remaining) => {
        if (remaining && remaining <= 1) {
          handleSubmit()
          return 0
        }
        return (remaining || 0) - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [handleSubmit, submitted, timeLeft])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleKeyDown = (event: KeyboardEvent) => {
      const targetTag = (event.target as HTMLElement).tagName
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(targetTag)) return

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        handleNext()
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        handlePrevious()
      }
      if (event.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
      const numberKey = Number(event.key)
      if (numberKey >= 1 && numberKey <= 9 && exam?.questions?.[numberKey - 1]) {
        event.preventDefault()
        handleNavigateQuestion(numberKey - 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [exam, handleNext, handlePrevious, handleNavigateQuestion, mobileMenuOpen])

  useEffect(() => {
    setOfflineStatus(!navigator.onLine)
    const handleOnline = () => setOfflineStatus(false)
    const handleOffline = () => setOfflineStatus(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOfflineStatus])

  if (isOffline) {
    return <OfflineExamRunner examId={Number(examId)} />
  }

  if (loading || !sessionId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-3xl p-8">
          <div className="space-y-4">
            <Skeleton height="h-8" width="w-2/5" />
            <Skeleton height="h-6" width="w-3/5" />
            <Skeleton height="h-72" />
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
        <Card className="max-w-lg w-full p-8 text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Unable to load exam</h2>
          <p className="text-sm text-slate-600 mb-6">{error}</p>
          <button
            type="button"
            onClick={() => safeNavigate(router, '/dashboard')}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">Exam submitted successfully</h2>
          <p className="text-slate-600 mb-8">Your answers have been received and your session is complete.</p>
          <button
            type="button"
            onClick={() => safeNavigate(router, '/dashboard')}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </Card>
      </div>
    )
  }

  if (!exam || !exam.questions) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
        <Card className="max-w-md w-full p-8 text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">No questions available</h2>
          <p className="text-slate-600">Please contact your instructor if this issue persists.</p>
        </Card>
      </div>
    )
  }

  const minutes = Math.floor((timeLeft || 0) / 60)
  const seconds = (timeLeft || 0) % 60
  const questionTitle = question?.content || question?.text || 'Question'

  return (
    <div className="min-h-screen bg-slate-50">
      <ExamHeader
        examTitle={exam.title}
        minutes={minutes}
        seconds={seconds}
        isTimeWarning={(timeLeft || 0) <= 300 && (timeLeft || 0) > 60}
        isTimeCritical={(timeLeft || 0) <= 60}
        reliability={reliabilityState}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        currentQuestion={safeQuestionIndex}
        totalQuestions={questionCount}
        answeredCount={answeredCount}
        onMenuToggle={() => setMobileMenuOpen(true)}
        showMobileMenu={mobileMenuOpen}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="space-y-6" aria-labelledby="exam-question-heading">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Question</p>
                <h2 id="exam-question-heading" className="text-2xl font-semibold text-slate-900 mt-2">
                  {questionTitle}
                </h2>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Answered</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{answeredCount} / {questionCount}</p>
              </div>
            </div>

            <QuestionCard
              content={questionTitle}
              options={question?.options || []}
              selectedAnswer={question ? answers[question.id] : undefined}
              onSelectAnswer={handleAnswerSelect}
              isDisabled={!isExamPlayable(reliabilityState)}
              isLoading={isSaving}
              questionNumber={safeQuestionIndex + 1}
              totalQuestions={questionCount}
            />
          </section>

          <aside className="space-y-6">
            <Card className="p-6 sticky top-24">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">Session status</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{getReliabilityMessage(reliabilityState)}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {reliabilityState.isOffline ? 'Offline' : reliabilityState.isReconnecting ? 'Reconnecting' : 'Live'}
                </span>
              </div>

              <div className="mt-6 space-y-3 text-sm text-slate-600">
                <p>• Autosave updates as you answer.</p>
                <p>• Use ← / → to move between questions.</p>
                <p>• Press a number key to jump to that question.</p>
              </div>
            </Card>

            <ExamNav
              questions={exam.questions}
              currentQuestion={safeQuestionIndex}
              answeredQuestions={answeredQuestions}
              onNavigate={handleNavigateQuestion}
              isOpen={mobileMenuOpen}
              onClose={() => setMobileMenuOpen(false)}
            />
          </aside>
        </div>
      </main>

      <ExamFooter
        currentQuestion={safeQuestionIndex}
        totalQuestions={questionCount}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        canSubmit={isExamPlayable(reliabilityState)}
      />
    </div>
  )
}
