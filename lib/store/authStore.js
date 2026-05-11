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
          // Mock API call - replace with actual API
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })
          
          if (!response.ok) throw new Error('Login failed')
          
          const data = await response.json()
          set({ user: data.user, token: data.token, loading: false })
          return data
        } catch (error) {
          set({ error: error.message, loading: false })
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
          
          if (!response.ok) throw new Error('Registration failed')
          
          const data = await response.json()
          set({ user: data.user, token: data.token, loading: false })
          return data
        } catch (error) {
          set({ error: error.message, loading: false })
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
