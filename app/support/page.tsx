'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

export default function SupportPage() {
  const [form, setForm] = useState({ subject: '', message: '', contactEmail: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{[k:string]:string}>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // client-side validation
    const errs: {[k:string]:string} = {}
    if (!form.subject || form.subject.trim().length < 5) errs.subject = 'Subject must be at least 5 characters'
    if (!form.message || form.message.trim().length < 10) errs.message = 'Message must be at least 10 characters'
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (form.contactEmail && !emailRe.test(form.contactEmail)) errs.contactEmail = 'Enter a valid email'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success('Support ticket created — ID: ' + (data.ticketId || ''))
        setForm({ subject: '', message: '', contactEmail: '' })
        setErrors({})
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to create support ticket')
      }
    } catch (err) {
      toast.error('Failed to create support ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-3xl mx-auto bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-white mb-4">Contact Support</h1>
        <p className="text-slate-400 mb-6">Describe your issue and we'll respond via the contact email provided.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Subject</label>
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={`w-full px-3 py-2 bg-slate-700/50 rounded-lg text-white focus:outline-none ${errors.subject ? 'border border-red-500' : 'border border-slate-600'}`} />
            {errors.subject && <p className="text-xs text-red-400 mt-1">{errors.subject}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Message</label>
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={6} className={`w-full px-3 py-2 bg-slate-700/50 rounded-lg text-white focus:outline-none ${errors.message ? 'border border-red-500' : 'border border-slate-600'}`} />
            {errors.message && <p className="text-xs text-red-400 mt-1">{errors.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Contact Email (optional)</label>
            <input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className={`w-full px-3 py-2 bg-slate-700/50 rounded-lg text-white focus:outline-none ${errors.contactEmail ? 'border border-red-500' : 'border border-slate-600'}`} />
            {errors.contactEmail && <p className="text-xs text-red-400 mt-1">{errors.contactEmail}</p>}
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Send</button>
            <button type="button" onClick={() => setForm({ subject: '', message: '', contactEmail: '' })} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">Clear</button>
          </div>
        </form>
      </div>
    </div>
  )
}
