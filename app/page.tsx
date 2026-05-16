'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, BarChart3, Shield, Users, Clock, CheckCircle } from 'lucide-react'

export default function LandingPage() {
  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Take exams with zero lag. Real-time progress tracking and instant grading.',
    },
    {
      icon: Shield,
      title: 'Secure & Proctored',
      description: 'Advanced anti-cheating measures including webcam monitoring and activity tracking.',
    },
    {
      icon: BarChart3,
      title: 'Detailed Analytics',
      description: 'Comprehensive performance insights, rankings, and detailed result reports.',
    },
    {
      icon: Users,
      title: 'Multi-Role Support',
      description: 'Separate dashboards for students, teachers, and school administrators.',
    },
    {
      icon: Clock,
      title: 'Auto-Save & Timer',
      description: 'Automatic answer saving and countdown timers to prevent data loss.',
    },
    {
      icon: CheckCircle,
      title: 'PDF Reports',
      description: 'Generate and download printable result sheets and performance reports.',
    },
  ]

  const testimonials = [
    {
      name: 'Chief Akunyili',
      school: 'Excellence Academy',
      message: 'The CBT platform has transformed how we conduct exams. Highly efficient!',
    },
    {
      name: 'Mrs. Okonkwo',
      school: 'Future Leaders School',
      message: 'Students love the modern interface and parents appreciate the transparency.',
    },
    {
      name: 'Dr. Chioma Nwankwo',
      school: 'Summit Preparatory',
      message: 'Best investment for our school. Results are accurate and instant.',
    },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            CBT Pro
          </div>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg hover:shadow-lg hover:shadow-blue-500/20 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Modern CBT Platform
              </span>
              <br />
              for Your School
            </h1>
            <p className="text-xl sm:text-2xl text-slate-400 mb-8 max-w-3xl mx-auto">
              Conduct secure online exinations with advanced analytics, instant grading,
              and detailed performance tracking all in one powerful platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition transform hover:scale-105"
              >
                Sign In <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </motion.div>

          {/* Hero Image/Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-20 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl opacity-20 blur-3xl"></div>
            <div className="relative bg-slate-800/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">10K+</div>
                  <div className="text-sm text-slate-400">Students Tested</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-cyan-400">500+</div>
                  <div className="text-sm text-slate-400">Schools</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-teal-400">99.9%</div>
                  <div className="text-sm text-slate-400">Uptime</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-400">24/7</div>
                  <div className="text-sm text-slate-400">Support</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-slate-400">Everything you need to run a professional CBT program</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group p-6 rounded-xl border border-slate-700 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50 transition"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 p-2.5 mb-4 group-hover:scale-110 transition">
                    <Icon className="w-full h-full text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Trusted by Schools</h2>
            <p className="text-xl text-slate-400">See what educators are saying about our platform</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl border border-slate-700 bg-slate-800/30"
              >
                <p className="text-slate-300 mb-4 italic">"{testimonial.message}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-slate-400">{testimonial.school}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">Ready to Transform Your Exams?</h2>
          <p className="text-xl text-slate-400 mb-8">
            Join hundreds of schools using CBT Pro for secure, efficient, and effective online examinations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition"
            >
              Sign In <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center justify-center px-8 py-4 border border-slate-600 rounded-xl font-semibold hover:border-slate-400 transition"
            >
              Contact Support
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/50 py-12 px-4 sm:px-6 lg:px-8 mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="#" className="hover:text-white transition">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="#" className="hover:text-white transition">About</Link></li>
                <li><Link href="#" className="hover:text-white transition">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="#" className="hover:text-white transition">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white transition">Terms</Link></li>
                <li><Link href="#" className="hover:text-white transition">Cookie Policy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="#" className="hover:text-white transition">Twitter</Link></li>
                <li><Link href="#" className="hover:text-white transition">LinkedIn</Link></li>
                <li><Link href="#" className="hover:text-white transition">Facebook</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex justify-between items-center text-slate-400 text-sm">
            <p>&copy; 2026 CBT Pro. All rights reserved.</p>
            <p>Made with ❤️ for educators</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

