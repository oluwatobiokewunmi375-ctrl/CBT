'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Mail, Lock, ArrowRight, Loader, Ticket } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loginMode, setLoginMode] = useState<'dashboard' | 'exam'>('dashboard')
  const [school, setSchool] = useState<any>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    studentNo: '',
    schoolCode: '',
  })

  useEffect(() => {
    const schoolCode = new URLSearchParams(window.location.search).get('school')
    if (schoolCode) {
      fetchSchoolBranding(schoolCode)
    }
  }, [])

  const fetchSchoolBranding = async (code: string) => {
    try {
      const res = await fetch(`/api/school?shortCode=${code}`)
      if (res.ok) {
        const data = await res.json()
        setSchool(data.school)
        setFormData(prev => ({ ...prev, schoolCode: code }))
      }
    } catch (error) {
      console.error('Failed to load school:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const loginData = loginMode === 'dashboard'
        ? { email: formData.email, password: formData.password }
        : { studentNo: formData.studentNo }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Login failed')
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      toast.success('Login successful!')

      if (loginMode === 'exam') {
        router.push('/exam-list')
      } else {
        if (data.user.role === 'SUPER_ADMIN') {
          router.push('/super-admin/dashboard')
        } else if (data.user.role === 'SCHOOL_ADMIN' || data.user.role === 'TEACHER') {
          router.push('/admin/dashboard')
        } else {
          toast.error('Dashboard login is only available for admins and teachers.')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-4 py-8"
    >
      {/* School Branding Background */}
      {school?.bannerUrl && (
        <div className="absolute inset-0 opacity-10">
          <img src={school.bannerUrl} alt="School Banner" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl">
          {/* School Logo */}
          {school?.logoUrl && (
            <div className="flex justify-center mb-6">
              <img src={school.logoUrl} alt={school.name} className="h-16 w-auto" />
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-6">
            {school?.name && <h1 className="text-xl font-bold mb-2">{school.name}</h1>}
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              CBT System Access
            </div>
            <p className="text-slate-400 max-w-xl mx-auto">
              Use Student ID login for exam access. Use Dashboard login only if you are a school or system administrator.
            </p>
          </div>

          {/* Login Mode Selection */}
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setLoginMode('dashboard')}
              className={`flex-1 py-3 rounded-lg font-semibold transition ${
                loginMode === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Dashboard Access
            </button>
            <button
              type="button"
              onClick={() => setLoginMode('exam')}
              className={`flex-1 py-3 rounded-lg font-semibold transition ${
                loginMode === 'exam'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Student Exam
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Dashboard Login */}
            {loginMode === 'dashboard' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      required
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-slate-700/80 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-slate-700/80 transition"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Exam Login */}
            {loginMode === 'exam' && (
              <div>
                <label className="block text-sm font-medium mb-2">Student ID Number</label>
                <div className="relative">
                  <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="studentNo"
                    value={formData.studentNo}
                    onChange={handleChange}
                    placeholder="e.g., 0001"
                    required
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-slate-700/80 transition text-center text-lg tracking-widest"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">Enter your 4-6 digit student ID number from your ID card</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-3 font-semibold flex items-center justify-center gap-2 transition transform hover:scale-105 mt-6"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  {loginMode === 'exam' ? 'Enter Exam' : 'Go to Dashboard'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="flex justify-center text-sm mt-6">
            <Link href="/forgot-password" className="text-blue-400 hover:text-blue-300">
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

