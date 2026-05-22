/**
 * Exam UI Components
 * 
 * Specialized components for exam experience:
 * - ExamHeader: Sticky top with timer, status, submit
 * - ExamNav: Question navigator (sidebar/drawer)
 * - QuestionCard: Modern question display with options
 * - ExamFooter: Navigation controls
 * - ReliabilityIndicator: Runtime status display
 */

import React, { useState } from 'react'
import { Button, Card, Badge, StatusIndicator, TimerDisplay, QuestionCounter, ProgressBar, Alert } from '../ui/design-system'
import { ReliabilityState, getReliabilityMessage } from '@/hooks/useExamReliability'

// ============================================================================
// ExamHeader - Sticky top bar with all critical information
// ============================================================================

interface ExamHeaderProps {
  examTitle: string
  minutes: number
  seconds: number
  isTimeWarning: boolean
  isTimeCritical: boolean
  reliability: ReliabilityState
  onSubmit: () => void
  isSubmitting?: boolean
  currentQuestion: number
  totalQuestions: number
  answeredCount: number
  onMenuToggle?: () => void
  showMobileMenu?: boolean
}

export function ExamHeader({
  examTitle,
  minutes,
  seconds,
  isTimeWarning,
  isTimeCritical,
  reliability,
  onSubmit,
  isSubmitting = false,
  currentQuestion,
  totalQuestions,
  answeredCount,
  onMenuToggle,
  showMobileMenu = false,
}: ExamHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          {/* Top row: Title and Menu Toggle */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={onMenuToggle}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{examTitle}</h1>
            </div>

            {/* Submit button - right aligned */}
            <Button
              variant="success"
              size="lg"
              onClick={onSubmit}
              disabled={reliability.sessionExpired || reliability.ownershipLost || isSubmitting}
              isLoading={isSubmitting}
              className="whitespace-nowrap"
            >
              Submit
            </Button>
          </div>

          {/* Bottom row: Timer, status, progress */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Timer */}
            <div>
              <TimerDisplay
                minutes={minutes}
                seconds={seconds}
                isWarning={isTimeWarning}
                isCritical={isTimeCritical}
              />
            </div>

            {/* Question counter */}
            <div className="hidden sm:block">
              <QuestionCounter current={currentQuestion + 1} total={totalQuestions} answered={answeredCount} />
            </div>

            {/* Reliability status */}
            <div>
              <StatusIndicator
                status={
                  reliability.criticalError
                    ? 'error'
                    : reliability.isOffline || reliability.isReconnecting
                      ? 'loading'
                      : reliability.autosaveStatus === 'saving'
                        ? 'loading'
                        : reliability.autosaveStatus === 'saved'
                          ? 'success'
                          : 'idle'
                }
                message={getReliabilityMessage(reliability)}
              />
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <ProgressBar
              value={answeredCount}
              max={totalQuestions}
              size="md"
              variant="primary"
            />
            <p className="text-xs text-gray-500 mt-1">
              {answeredCount} of {totalQuestions} answered
            </p>
          </div>
        </div>
      </div>

      {/* Critical alerts */}
      {reliability.sessionExpired && (
        <Alert variant="danger" className="rounded-none border-0 border-t mx-0">
          ⏰ Your session has expired. You cannot submit further answers.
        </Alert>
      )}

      {reliability.ownershipLost && (
        <Alert variant="warning" className="rounded-none border-0 border-t mx-0">
          ⚠️ Another tab took over this exam. This tab is now read-only.
        </Alert>
      )}

      {reliability.criticalError && (
        <Alert variant="danger" className="rounded-none border-0 border-t mx-0">
          {reliability.criticalError}
        </Alert>
      )}
    </header>
  )
}

// ============================================================================
// ExamNav - Question navigator (sidebar on desktop, drawer on mobile)
// ============================================================================

interface ExamNavProps {
  questions: Array<{ id: string; flagged?: boolean }>
  currentQuestion: number
  answeredQuestions: Record<string, boolean>
  onNavigate: (index: number) => void
  isOpen?: boolean
  onClose?: () => void
}

export function ExamNav({
  questions,
  currentQuestion,
  answeredQuestions,
  onNavigate,
  isOpen = true,
  onClose,
}: ExamNavProps) {
  const navContent = (
    <Card className="rounded-none lg:rounded-lg">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Questions</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Question grid */}
        <div className="grid grid-cols-6 gap-2">
          {questions.map((question, index) => {
            const isAnswered = answeredQuestions[index]
            const isFlagged = question.flagged

            return (
              <button
                key={index}
                onClick={() => {
                  onNavigate(index)
                  if (onClose) onClose()
                }}
                className={`
                  aspect-square rounded-lg font-semibold text-sm transition-all
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                  ${
                    index === currentQuestion
                      ? 'bg-blue-600 text-white shadow-lg'
                      : isAnswered
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                  ${isFlagged ? 'ring-2 ring-yellow-300' : ''}
                `}
                aria-current={index === currentQuestion ? 'true' : undefined}
                aria-label={`Question ${index + 1}${isAnswered ? ', answered' : ''}${isFlagged ? ', flagged' : ''}`}
              >
                {index + 1}
                {isFlagged && <span className="sr-only"> flagged</span>}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-gray-200 space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 rounded" />
            <span className="text-gray-600">Answered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 rounded" />
            <span className="text-gray-600">Not answered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded" />
            <span className="text-gray-600">Current</span>
          </div>
        </div>
      </div>
    </Card>
  )

  // Mobile: Drawer overlay
  if (!isOpen && onClose) {
    return null
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
          role="presentation"
        />
      )}

      {/* Navigation panel */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 w-72 bg-white border-r border-gray-200 overflow-y-auto
          lg:w-full lg:border-0 lg:bg-transparent lg:overflow-visible
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          z-30 lg:z-auto pt-16 lg:pt-0
        `}
      >
        <div className="lg:sticky lg:top-0 lg:pt-0 pt-4">{navContent}</div>
      </div>
    </>
  )
}

// ============================================================================
// QuestionCard - Modern question display
// ============================================================================

interface QuestionOption {
  id: string
  text: string
}

interface QuestionCardProps {
  content: string
  options: QuestionOption[]
  selectedAnswer?: string
  onSelectAnswer: (optionId: string) => void
  isDisabled?: boolean
  isLoading?: boolean
  questionNumber: number
  totalQuestions: number
}

export function QuestionCard({
  content,
  options,
  selectedAnswer,
  onSelectAnswer,
  isDisabled = false,
  isLoading = false,
  questionNumber,
  totalQuestions,
}: QuestionCardProps) {
  return (
    <Card elevated>
      <div className="p-6 sm:p-8">
        {/* Question header */}
        <div className="mb-8">
          <Badge variant="info" size="sm">
            Question {questionNumber} of {totalQuestions}
          </Badge>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-3 leading-relaxed">
            {content}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelectAnswer(option.id)}
              disabled={isDisabled || isLoading}
              className={`
                w-full p-4 sm:p-5 text-left rounded-xl border-2 transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                disabled:opacity-60 disabled:cursor-not-allowed
                ${
                  selectedAnswer === option.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50'
                }
              `}
              aria-pressed={selectedAnswer === option.id}
              aria-label={option.text}
            >
              <div className="flex items-start gap-4">
                {/* Radio button */}
                <div
                  className={`
                    w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5
                    transition-colors duration-200
                    ${
                      selectedAnswer === option.id
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300 bg-white'
                    }
                  `}
                >
                  {selectedAnswer === option.id && (
                    <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  )}
                </div>

                {/* Option text */}
                <span className="text-gray-900 font-medium text-base sm:text-lg leading-relaxed flex-1">
                  {option.text}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Hint */}
        {selectedAnswer && (
          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              ✓ Answer selected. Continue to the next question or review this one.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="mt-6 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-sm text-blue-700">Saving answer...</p>
          </div>
        )}
      </div>
    </Card>
  )
}

// ============================================================================
// ExamFooter - Navigation controls
// ============================================================================

interface ExamFooterProps {
  currentQuestion: number
  totalQuestions: number
  onPrevious: () => void
  onNext: () => void
  onSubmit?: () => void
  isSubmitting?: boolean
  canSubmit?: boolean
}

export function ExamFooter({
  currentQuestion,
  totalQuestions,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting = false,
  canSubmit = true,
}: ExamFooterProps) {
  const isFirstQuestion = currentQuestion === 0
  const isLastQuestion = currentQuestion === totalQuestions - 1

  return (
    <div className="border-t border-gray-200 bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Previous button */}
          <Button
            variant="secondary"
            size="md"
            onClick={onPrevious}
            disabled={isFirstQuestion}
            icon="←"
          >
            <span className="hidden sm:inline">Previous</span>
          </Button>

          {/* Keyboard hint */}
          <div className="text-center text-xs sm:text-sm text-gray-600">
            <p>← → Arrow keys to navigate • 1–4 to select answer</p>
          </div>

          {/* Next or Submit button */}
          {isLastQuestion && onSubmit ? (
            <Button
              variant="success"
              size="md"
              onClick={onSubmit}
              disabled={!canSubmit || isSubmitting}
              isLoading={isSubmitting}
            >
              <span className="hidden sm:inline">Submit Exam</span>
              <span className="sm:hidden">Submit</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={onNext}
              disabled={isLastQuestion}
              icon="→"
            >
              <span className="hidden sm:inline">Next</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
