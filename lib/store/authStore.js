import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
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
            token: data.token,
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
            token: null
          })
          throw error
        }
      },

      logout: () => {
        set({ user: null, token: null, error: null })
        localStorage.removeItem('auth-storage')
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
            token: null
          })
          throw error
        }
      },

      isAuthenticated: () => {
        const state = get()
        return !!state.user && !!state.token
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)
