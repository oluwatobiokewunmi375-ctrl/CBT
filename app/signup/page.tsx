'use client'

import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-4 py-8">
      <div className="relative w-full max-w-lg">
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700 rounded-3xl p-10 shadow-2xl">
          <div className="text-center mb-8">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              Registration Restricted
            </div>
            <p className="text-slate-300 text-base sm:text-lg">
              Account registration is not open to the public. Student, teacher, and admin accounts are created by
              your school administrators or the super admin.
            </p>
          </div>

          <div className="space-y-4 text-slate-400">
            <p>
              If you are a student, please obtain your student ID from your school and use the exam login option.
            </p>
            <p>
              If you represent a school or need a dashboard account, contact your super administrator to request access.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-center hover:bg-blue-500 transition"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

