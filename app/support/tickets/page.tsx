'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchTickets() }, [])

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const res = await fetch('/api/support', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setTickets(data.tickets || [])
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to load tickets')
      }
    } catch (err) {
      toast.error('Failed to load tickets')
    } finally { setLoading(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-5xl mx-auto bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-white mb-4">Support Tickets</h1>
        {tickets.length === 0 ? (
          <p className="text-slate-400">No tickets found.</p>
        ) : (
          <div className="space-y-4">
            {tickets.map(t => (
              <div key={t.id} className="bg-slate-900/40 border border-slate-700 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-white font-semibold">{t.description}</h3>
                    <p className="text-slate-400 text-sm">{new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-slate-300 text-sm">{t.actorId || '—'}</div>
                </div>
                <div className="mt-3 text-slate-300 text-sm">{t.meta?.message}</div>
                {t.meta?.contactEmail && <div className="mt-2 text-slate-400 text-sm">Contact: {t.meta.contactEmail}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
