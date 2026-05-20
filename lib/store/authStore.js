import { create } from 'zustand'

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: false,
  error: null,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }
      
      set({
        user: data.user,
        loading: false,
        error: null
      })
      return data
    } catch (error) {
      const errorMessage = error.message || 'Login failed'
      set({
        error: errorMessage,
        loading: false,
        user: null,
      })
      throw error
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout request failed:', error)
    }
    set({ user: null, loading: false, error: null })
  },

  register: async (email, password, fullName) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }
      
      set({
        user: data.user,
        loading: false,
        error: null
      })
      return data
    } catch (error) {
      const errorMessage = error.message || 'Registration failed'
      set({
        error: errorMessage,
        loading: false,
        user: null,
      })
      throw error
    }
  },

  isAuthenticated: () => {
    const state = get()
    return !!state.user
  },
}))
