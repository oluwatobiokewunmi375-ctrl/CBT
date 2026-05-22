/**
 * Design System: Core Components
 * 
 * Production-grade UI components for exam experience
 * - Clean, accessible, responsive
 * - Consistent spacing, typography, colors
 * - Smooth animations and transitions
 * - Mobile-first approach
 */

import React from 'react'

// ============================================================================
// Button Variants
// ============================================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  icon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      icon,
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed'

    const variantStyles = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    }

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm gap-2',
      md: 'px-4 py-2 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {icon && !isLoading && <span>{icon}</span>}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

// ============================================================================
// Card
// ============================================================================

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ elevated = false, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-white rounded-lg ${
          elevated ? 'shadow-lg border border-gray-100' : 'shadow border border-gray-200'
        } ${className}`}
        {...props}
      />
    )
  }
)
Card.displayName = 'Card'

// ============================================================================
// Badge - for status indicators
// ============================================================================

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
  dot?: boolean
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'md', dot = false, className = '', children, ...props }, ref) => {
    const variantStyles = {
      default: 'bg-gray-100 text-gray-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      danger: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800',
    }

    const sizeStyles = {
      sm: 'px-2 py-0.5 text-xs font-medium',
      md: 'px-3 py-1 text-sm font-medium',
    }

    return (
      <span
        ref={ref}
        className={`inline-flex items-center gap-1 rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {dot && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" />}
        {children}
      </span>
    )
  }
)
Badge.displayName = 'Badge'

// ============================================================================
// Status Indicator - animated status display
// ============================================================================

interface StatusIndicatorProps {
  status: 'idle' | 'loading' | 'success' | 'error' | 'warning'
  message?: string
  animate?: boolean
}

export function StatusIndicator({
  status,
  message,
  animate = true,
}: StatusIndicatorProps) {
  const statusConfig = {
    idle: { color: 'text-gray-500', bg: 'bg-gray-50', icon: '●' },
    loading: { color: 'text-blue-500', bg: 'bg-blue-50', icon: '⟳' },
    success: { color: 'text-green-600', bg: 'bg-green-50', icon: '✓' },
    error: { color: 'text-red-600', bg: 'bg-red-50', icon: '✕' },
    warning: { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '⚠' },
  }

  const config = statusConfig[status]
  const isAnimating = animate && (status === 'loading' || status === 'warning')

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bg}`}>
      <span
        className={`text-lg ${config.color} ${isAnimating ? 'animate-pulse' : ''}`}
      >
        {config.icon}
      </span>
      {message && <span className={`text-sm font-medium ${config.color}`}>{message}</span>}
    </div>
  )
}

// ============================================================================
// Skeleton Loader
// ============================================================================

interface SkeletonProps {
  width?: string
  height?: string
  circle?: boolean
  className?: string
}

export function Skeleton({
  width = 'w-full',
  height = 'h-4',
  circle = false,
  className = '',
}: SkeletonProps) {
  return (
    <div
      className={`
        ${circle ? 'rounded-full' : 'rounded'}
        ${width} ${height}
        bg-gray-200 animate-pulse
        ${className}
      `}
    />
  )
}

// ============================================================================
// Loading State
// ============================================================================

export function LoadingState() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin">
        <svg className="w-8 h-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    </div>
  )
}

// ============================================================================
// Alert
// ============================================================================

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger'
  title?: string
  onDismiss?: () => void
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ variant = 'info', title, onDismiss, children, className = '', ...props }, ref) => {
    const variantStyles = {
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      success: 'bg-green-50 border-green-200 text-green-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      danger: 'bg-red-50 border-red-200 text-red-800',
    }

    const icons = {
      info: 'ℹ',
      success: '✓',
      warning: '⚠',
      danger: '✕',
    }

    return (
      <div
        ref={ref}
        className={`rounded-lg border ${variantStyles[variant]} p-4 ${className}`}
        role="alert"
        {...props}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-lg mt-0.5">{icons[variant]}</span>
            <div>
              {title && <h3 className="font-semibold mb-1">{title}</h3>}
              <p className="text-sm">{children}</p>
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-lg hover:opacity-70 transition-opacity mt-1"
              aria-label="Dismiss"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    )
  }
)
Alert.displayName = 'Alert'

// ============================================================================
// Progress Bar
// ============================================================================

interface ProgressBarProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'success' | 'warning'
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  variant = 'primary',
}: ProgressBarProps) {
  const percentage = (value / max) * 100

  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  const variantStyles = {
    primary: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
  }

  return (
    <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeStyles[size]}`}>
      <div
        className={`${variantStyles[variant]} h-full transition-all duration-500 ease-out`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemax={max}
        aria-valuemin={0}
      />
    </div>
  )
}

// ============================================================================
// Timer Display - large, prominent timer
// ============================================================================

interface TimerDisplayProps {
  minutes: number
  seconds: number
  isWarning?: boolean
  isCritical?: boolean
}

export function TimerDisplay({
  minutes,
  seconds,
  isWarning = false,
  isCritical = false,
}: TimerDisplayProps) {
  let colorClass = 'text-gray-900'
  if (isCritical) colorClass = 'text-red-600'
  else if (isWarning) colorClass = 'text-orange-600'

  return (
    <div className="text-center">
      <div className={`text-5xl font-bold tabular-nums ${colorClass}`}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
      <p className="text-sm text-gray-600 mt-1">Time remaining</p>
    </div>
  )
}

// ============================================================================
// Question Counter
// ============================================================================

interface QuestionCounterProps {
  current: number
  total: number
  answered: number
}

export function QuestionCounter({
  current,
  total,
  answered,
}: QuestionCounterProps) {
  return (
    <div className="text-sm text-gray-600">
      <p>
        <span className="font-semibold">Q {current} of {total}</span>
      </p>
      <p className="text-xs mt-1">
        {answered} of {total} answered
      </p>
    </div>
  )
}
