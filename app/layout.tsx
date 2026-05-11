import './globals.css'
import { Toaster } from 'react-hot-toast'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

export const metadata = {
  title: 'CBT SaaS - Computer-Based Testing Platform',
  description: 'Enterprise-grade exam platform with security, analytics, and offline support',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-slate-950 text-white">
        <ServiceWorkerRegister />
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}





