import "@/lib/seedExam"
import './globals.css'
import { Toaster } from 'react-hot-toast'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import CBTProvider from '@/components/CBTProvider'

export const metadata = {
  title: 'CBT Pro - Modern Computer-Based Testing Platform',
  description: 'Enterprise-grade online exam platform with security, analytics, and offline support for schools',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-slate-950 text-white">
        <ServiceWorkerRegister />
        <CBTProvider>
          {children}
        </CBTProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}










