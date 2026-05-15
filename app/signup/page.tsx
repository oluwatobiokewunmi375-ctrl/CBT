'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Mail, Lock, User, Loader, ArrowRight } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [userType, setUserType] = useState<'student' | 'admin'>('student')
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    schoolCode: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    dob: '',
    gender: '',
    address: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fullName || !formData.email || !formData.password) {
      toast.error('Please fill all required fields')
      return
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const role = userType === 'admin' ? 'SCHOOL_ADMIN' : 'STUDENT'
      const payload: any = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role,
        schoolCode: formData.schoolCode || undefined,
      }

      if (userType === 'student') {
        payload.parentName = formData.parentName || undefined
        payload.parentPhone = formData.parentPhone || undefined
        payload.parentEmail = formData.parentEmail || undefined
        payload.dob = formData.dob || undefined
        payload.gender = formData.gender || undefined
        payload.address = formData.address || undefined
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Registration failed')
        return
      }

      if (userType === 'student' && data.user.student?.studentNo) {
        toast.success(`Account created! Your Student ID: ${data.user.student.studentNo}`)
      } else {
        toast.success('Account created! Logging you in...')
      }

      localStorage.setItem('authToken', data.token || '')
      localStorage.setItem('user', JSON.stringify(data.user))

      if (role === 'SCHOOL_ADMIN') {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-4 py-8">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              CBT Pro
            </div>
            <h1 className="text-2xl font-bold mb-2">Create Account</h1>
            <p className="text-slate-400">Get started with CBT Pro today</p>
          </div>

          {/* User Type Selection */}
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setUserType('student')}
              className={`flex-1 py-3 rounded-lg font-semibold transition ${
                userType === 'student'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setUserType('admin')}
              className={`flex-1 py-3 rounded-lg font-semibold transition ${
                userType === 'admin'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              School Admin
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-slate-700/80 transition"
                />
              </div>
            </div>

            {/* Email */}
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

            {/* School Code */}
            <div>
              <label className="block text-sm font-medium mb-2">School Code {userType === 'student' && '*'}</label>
              <input
                type="text"
                name="schoolCode"
                value={formData.schoolCode}
                onChange={handleChange}
                placeholder="e.g., SCH001"
                required={userType === 'student'}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-slate-700/80 transition"
              />
            </div>

            {/* Student Profile Fields */}
            {userType === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:bg-slate-700/80 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:bg-slate-700/80 transition"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Your home address"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-slate-700/80 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Parent/Guardian Name</label>
                  <input
                    type="text"
                    name="parentName"
                    value={formData.parentName}
                    onChange={handleChange}
                    placeholder="Parent or guardian full name"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-slate-700/80 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Parent/Guardian Phone</label>
                  <input
                    type="tel"
                    name="parentPhone"
                    value={formData.parentPhone}
                    onChange={handleChange}
                    placeholder="+234 XXX XXXX XXX"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-slate-700/80 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Parent/Guardian Email</label>
                  <input
                    type="email"
                    name="parentEmail"
                    value={formData.parentEmail}
                    onChange={handleChange}
                    placeholder="parent@example.com"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-slate-700/80 transition"
                  />
                </div>
              </>
            )}

            {/* Password */}
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
              <p className="text-xs text-slate-400 mt-1">Minimum 8 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-slate-700/80 transition"
                />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-1"
              />
              <label htmlFor="terms" className="text-xs text-slate-400">
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-3 font-semibold flex items-center justify-center gap-2 transition transform hover:scale-105 mt-6"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-slate-400 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

