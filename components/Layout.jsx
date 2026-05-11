'use client'

import Navbar from './Navbar'
import { Toaster } from 'react-hot-toast'

export default function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-950 text-white">
        {children}
      </main>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
        }}
      />
    </>
  )
}
