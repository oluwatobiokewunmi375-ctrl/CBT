"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export default function VerifyEmailPage() {
  const [token, setToken] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (typeof window === "undefined") return
    const tokenParam = new URLSearchParams(window.location.search).get("token") || ""
    setToken(tokenParam)
  }, [])

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) return
      setStatus("loading")
      setMessage("")
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })
        const data = await res.json()
        if (!res.ok) {
          setStatus("error")
          setMessage(data.error || "Email verification failed.")
          return
        }
        setStatus("success")
        setMessage(data.message || "Your email address has been verified successfully.")
      } catch (err) {
        console.error(err)
        setStatus("error")
        setMessage("Unexpected error verifying your email.")
      }
    }

    verifyToken()
  }, [token])

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-white">Verify Email</h1>
          <p className="mt-2 text-slate-400">Confirm your email to activate your account and return to the dashboard.</p>
        </div>

        <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6">
          {status === "idle" && <p className="text-slate-300">Verifying your token, please wait…</p>}
          {status === "loading" && <p className="text-slate-300">Verifying your email now…</p>}
          {status === "success" && <p className="text-emerald-300">{message}</p>}
          {status === "error" && <p className="text-red-300">{message}</p>}
        </div>

        <div className="mt-6 text-center text-sm text-slate-400">
          <Link href="/login" className="text-cyan-300 hover:text-cyan-200">
            Return to Sign In
          </Link>
        </div>
      </div>
    </main>
  )
}
