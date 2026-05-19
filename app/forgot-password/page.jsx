"use client"

import { useState } from "react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [resetUrl, setResetUrl] = useState("")

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")
    setResetUrl("")

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Unable to generate reset link. Please try again.")
        return
      }

      setMessage(data.message || "If that email exists, a reset link has been issued.")
      if (data.resetUrl) {
        setResetUrl(data.resetUrl)
      }
    } catch (err) {
      console.error(err)
      setError("Unexpected error while requesting password reset.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-slate-400">Enter your email address and we will generate a secure password reset link.</p>
        </div>

        {message ? (
          <div className="rounded-xl border border-green-500/30 bg-emerald-950/80 p-4 mb-6">
            <p className="text-green-200 font-semibold">{message}</p>
            {resetUrl ? (
              <div className="mt-3 text-sm text-slate-300 break-words">
                <p className="font-medium">Development reset link:</p>
                <Link href={resetUrl} className="text-cyan-300 hover:text-cyan-200 break-all">
                  {resetUrl}
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-950/80 p-4 mb-6 text-red-200">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-200">Email address</label>
          <input
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-white font-semibold transition hover:from-blue-700 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Generating reset link…" : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          <Link href="/login" className="text-cyan-300 hover:text-cyan-200">
            Return to Sign In
          </Link>
        </div>
      </div>
    </main>
  )
}
