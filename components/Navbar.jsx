'use client'

import { useAuthStore } from '@/lib/store/authStore'
import { useOfflineStatus } from '@/lib/hooks/useOfflineStatus'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, X, LogOut, Wifi, WifiOff } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const { isOnline } = useOfflineStatus()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!user) return null

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">C</span>
            </div>
            <span className="text-white font-bold text-lg">CBT</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/dashboard" className="text-gray-300 hover:text-white transition">
              Dashboard
            </Link>
            <Link href="/exam" className="text-gray-300 hover:text-white transition">
              Exams
            </Link>
            <Link href="/results" className="text-gray-300 hover:text-white transition">
              Results
            </Link>
          </div>

          {/* Status & User Menu */}
          <div className="flex items-center space-x-4">
            {isOnline ? (
              <div className="flex items-center space-x-1 text-green-400 text-sm">
                <Wifi size={16} />
                <span>Online</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-yellow-400 text-sm">
                <WifiOff size={16} />
                <span>Offline</span>
              </div>
            )}

            <div className="relative group">
              <button className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition">
                <span className="text-sm text-gray-300">{user.fullName || user.email}</span>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-red-400 hover:bg-slate-700 rounded-lg transition"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-300 hover:text-white"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700">
          <div className="px-4 py-2 space-y-2">
            <Link
              href="/dashboard"
              className="block px-4 py-2 text-gray-300 hover:bg-slate-700 rounded-lg transition"
            >
              Dashboard
            </Link>
            <Link
              href="/exam"
              className="block px-4 py-2 text-gray-300 hover:bg-slate-700 rounded-lg transition"
            >
              Exams
            </Link>
            <Link
              href="/results"
              className="block px-4 py-2 text-gray-300 hover:bg-slate-700 rounded-lg transition"
            >
              Results
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
