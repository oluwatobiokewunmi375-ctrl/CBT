/**
 * Hook for tracking exam runtime reliability states
 * Provides visual indicators for: autosave, reconnect, offline, ownership, session restore
 * 
 * IMPORTANT: This hook only tracks UI-visible states.
 * It does NOT mutate session, version, or ownership state.
 * All mutations go through the protected API routes.
 * 
 * Safe to use in: UI display, status indicators, animations
 * NEVER use for: deciding to skip autosave, bypassing submit, ignoring 409 errors
 */

import { useCallback, useEffect, useState } from 'react'

export interface ReliabilityState {
  // Autosave states
  autosaveStatus: 'idle' | 'saving' | 'saved' | 'error' | 'conflict'
  lastAutosaveTime?: number
  autosaveError?: string

  // Connectivity states
  isOffline: boolean
  isReconnecting: boolean
  connectionError?: string

  // Ownership states
  isOwner: boolean
  ownershipLost: boolean
  ownershipError?: string

  // Session states
  isSessionValid: boolean
  isRestoring: boolean
  sessionError?: string
  sessionExpired: boolean

  // Grace window states
  inGraceWindow: boolean
  gracedTimeRemaining?: number

  // Critical alerts
  criticalError?: string
}

interface UseExamReliabilityOptions {
  onAutosaveConflict?: () => void
  onOwnershipLost?: () => void
  onSessionExpired?: () => void
  onCriticalError?: (error: string) => void
}

export function useExamReliability(options: UseExamReliabilityOptions = {}) {
  const [state, setState] = useState<ReliabilityState>({
    autosaveStatus: 'idle',
    isOffline: false,
    isReconnecting: false,
    isOwner: true,
    ownershipLost: false,
    isSessionValid: true,
    isRestoring: false,
    sessionExpired: false,
    inGraceWindow: false,
  })

  // Track autosave status
  const trackAutosave = useCallback(
    (status: 'saving' | 'saved' | 'error' | 'conflict', error?: string) => {
      setState((prev) => ({
        ...prev,
        autosaveStatus: status,
        lastAutosaveTime: Date.now(),
        autosaveError: error,
      }))

      if (status === 'conflict' && options.onAutosaveConflict) {
        options.onAutosaveConflict()
      }

      // Auto-clear saved status after 2 seconds
      if (status === 'saved') {
        const timer = setTimeout(() => {
          setState((prev) =>
            prev.autosaveStatus === 'saved' ? { ...prev, autosaveStatus: 'idle' } : prev
          )
        }, 2000)
        return () => clearTimeout(timer)
      }
    },
    [options]
  )

  // Track connectivity
  const setOfflineStatus = useCallback((offline: boolean) => {
    setState((prev) => ({
      ...prev,
      isOffline: offline,
      isReconnecting: offline ? false : prev.isReconnecting,
    }))
  }, [])

  const setReconnecting = useCallback((reconnecting: boolean, error?: string) => {
    setState((prev) => ({
      ...prev,
      isReconnecting: reconnecting,
      connectionError: error,
    }))
  }, [])

  // Track ownership
  const setOwnershipStatus = useCallback((isOwner: boolean, lost?: boolean) => {
    setState((prev) => {
      const newState = { ...prev, isOwner, ownershipLost: lost || false }
      if (lost && options.onOwnershipLost) {
        options.onOwnershipLost()
      }
      return newState
    })
  }, [options])

  // Track session
  const setSessionStatus = useCallback(
    (valid: boolean, error?: string, expired?: boolean) => {
      setState((prev) => {
        const newState = {
          ...prev,
          isSessionValid: valid,
          sessionError: error,
          sessionExpired: expired || false,
        }
        if (expired && options.onSessionExpired) {
          options.onSessionExpired()
        }
        return newState
      })
    },
    [options]
  )

  const setRestoring = useCallback((restoring: boolean) => {
    setState((prev) => ({
      ...prev,
      isRestoring: restoring,
    }))
  }, [])

  // Track grace window
  const setGraceWindow = useCallback((inGrace: boolean, timeRemaining?: number) => {
    setState((prev) => ({
      ...prev,
      inGraceWindow: inGrace,
      gracedTimeRemaining: timeRemaining,
    }))
  }, [])

  // Track critical errors
  const setCriticalError = useCallback(
    (error: string | null) => {
      setState((prev) => {
        const newState = { ...prev, criticalError: error || undefined }
        if (error && options.onCriticalError) {
          options.onCriticalError(error)
        }
        return newState
      })
    },
    [options]
  )

  // Monitor online/offline
  useEffect(() => {
    const handleOnline = () => setOfflineStatus(false)
    const handleOffline = () => setOfflineStatus(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOfflineStatus])

  return {
    state,
    trackAutosave,
    setOfflineStatus,
    setReconnecting,
    setOwnershipStatus,
    setSessionStatus,
    setRestoring,
    setGraceWindow,
    setCriticalError,
  }
}

/**
 * Helper: Get human-readable status message
 */
export function getReliabilityMessage(state: ReliabilityState): string {
  if (state.criticalError) return `⚠️ ${state.criticalError}`
  if (state.isOffline) return '📡 Offline - will sync when connected'
  if (state.isReconnecting) return '🔄 Reconnecting...'
  if (state.isRestoring) return '↩️ Restoring session...'
  if (state.ownershipLost) return '⚠️ Another tab took over'
  if (state.sessionExpired) return '⏰ Session expired'
  if (state.inGraceWindow) return `⏱️ Grace window: ${state.gracedTimeRemaining}s remaining`
  if (state.autosaveStatus === 'saving') return '💾 Saving...'
  if (state.autosaveStatus === 'saved') return '✅ Saved'
  if (state.autosaveStatus === 'error') return `❌ Save failed: ${state.autosaveError}`
  if (state.autosaveStatus === 'conflict') return '⚠️ Version conflict - refreshing'
  return '✓ All good'
}

/**
 * Helper: Check if exam is still playable
 */
export function isExamPlayable(state: ReliabilityState): boolean {
  return (
    !state.sessionExpired &&
    !state.ownershipLost &&
    !state.criticalError &&
    state.isSessionValid
  )
}
