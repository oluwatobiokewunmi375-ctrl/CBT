import { create } from 'zustand'

export const useExamStore = create((set, get) => ({
  currentExam: null,
  exams: [],
  loading: false,
  error: null,
  offlineMode: false,

  setCurrentExam: (exam) => set({ currentExam: exam }),
  setExams: (exams) => set({ exams }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setOfflineMode: (offlineMode) => set({ offlineMode }),

  fetchExams: async () => {
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/exams')
      if (!response.ok) throw new Error('Failed to fetch exams')
      const data = await response.json()
      set({ exams: data, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  fetchExamById: async (id) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch(`/api/exams/${id}`)
      if (!response.ok) throw new Error('Failed to fetch exam')
      const data = await response.json()
      set({ currentExam: data, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },
}))
