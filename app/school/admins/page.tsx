'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

export default function SchoolAdminsPage() {
  const router = useRouter()
  const [admins, setAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '', role: 'ADMIN' })
  const [formErrors, setFormErrors] = useState<{[k:string]:string}>({})

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return router.push('/login')

      const res = await fetch('/api/school/admins', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setAdmins(data.admins || [])
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to load admins')
      }
    } catch (err) {
      toast.error('Failed to load admins')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    // client-side validation
    const errors: {[k:string]:string} = {}
    if (!formData.fullName || formData.fullName.trim().length < 2) errors.fullName = 'Full name is required (min 2 chars)'
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email || !emailRe.test(formData.email)) errors.email = 'Valid email is required'
    if (!formData.password || formData.password.length < 8) errors.password = 'Password must be at least 8 characters'
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      const token = localStorage.getItem('token')
      if (!token) return router.push('/login')

      const res = await fetch('/api/school/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast.success('Admin created')
        setShowForm(false)
        setFormData({ email: '', password: '', fullName: '', role: 'ADMIN' })
        setFormErrors({})
        fetchAdmins()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to create admin')
      }
    } catch (err) {
      toast.error('Error creating admin')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this admin?')) return
    try {
      const token = localStorage.getItem('token')
      if (!token) return router.push('/login')

      const res = await fetch(`/api/school/admins/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        toast.success('Admin deleted')
        fetchAdmins()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to delete admin')
      }
    } catch (err) {
      toast.error('Error deleting admin')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">🏫 School Admins</h1>
            <p className="text-slate-400">Admins scoped to your school</p>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex justify-end">
            <button onClick={() => { setShowForm(true); setFormData({ email: '', password: '', fullName: '', role: 'ADMIN' }) }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Add Admin</button>
          </div>
          {admins.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-400 text-lg">No admins found for this school.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50 border-b border-slate-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Name</th>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Email</th>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Role</th>
                    <th className="px-6 py-4 text-left text-slate-300 font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a: any, idx: number) => (
                    <tr key={a.id} className={idx % 2 === 0 ? 'bg-slate-700/20' : 'bg-slate-700/10'}>
                      <td className="px-6 py-4 text-white font-medium">{a.fullName || '-'}</td>
                      <td className="px-6 py-4 text-slate-300">{a.email}</td>
                      <td className="px-6 py-4 text-slate-300">{a.role}</td>
                      <td className="px-6 py-4 text-slate-300">{new Date(a.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-600">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Add School Admin</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                <input value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className={`w-full px-3 py-2 bg-slate-700/50 rounded-lg text-white focus:outline-none ${formErrors.fullName ? 'border border-red-500' : 'border border-slate-600'}`} />
                {formErrors.fullName && <p className="text-xs text-red-400 mt-1">{formErrors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`w-full px-3 py-2 bg-slate-700/50 rounded-lg text-white focus:outline-none ${formErrors.email ? 'border border-red-500' : 'border border-slate-600'}`} />
                {formErrors.email && <p className="text-xs text-red-400 mt-1">{formErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={`w-full px-3 py-2 bg-slate-700/50 rounded-lg text-white focus:outline-none ${formErrors.password ? 'border border-red-500' : 'border border-slate-600'}`} />
                {formErrors.password && <p className="text-xs text-red-400 mt-1">{formErrors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white">
                  <option value="ADMIN">Admin</option>
                  <option value="SCHOOL_ADMIN">School Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Create</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
