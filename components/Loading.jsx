'use client'

export function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading...</p>
      </div>
    </div>
  )
}

export function LoadingSpinner({ size = 'md' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
  )
}

export function LoadingCard() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 bg-slate-800 rounded mb-4"></div>
      <div className="h-4 bg-slate-800 rounded mb-2"></div>
      <div className="h-4 bg-slate-800 rounded w-3/4"></div>
    </div>
  )
}
