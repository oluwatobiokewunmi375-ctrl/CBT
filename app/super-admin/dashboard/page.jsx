import { prisma } from '@/lib/prisma'

export default async function SuperAdminDashboard() {
  const [schoolCount, adminCount, examCount, studentCount] = await Promise.all([
    prisma.school.count(),
    prisma.user.count({ where: { role: 'SUPER_ADMIN' } }),
    prisma.exam.count({ where: { status: 'PUBLISHED' } }),
    prisma.student.count(),
  ])

  return (
    <main className="min-h-screen bg-slate-950 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-800 bg-slate-900/95 p-10 shadow-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Super Admin Portal</p>
            <h1 className="mt-3 text-4xl font-bold text-white">Super Admin Dashboard</h1>
            <p className="mt-2 text-slate-400 max-w-2xl">
              Review platform statistics, manage schools, and validate student exam readiness from one central screen.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
            <p className="text-sm text-slate-400">Schools</p>
            <p className="mt-3 text-3xl font-bold text-white" data-testid="super-admin-school-count">{schoolCount}</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
            <p className="text-sm text-slate-400">Super Admins</p>
            <p className="mt-3 text-3xl font-bold text-white" data-testid="super-admin-user-count">{adminCount}</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
            <p className="text-sm text-slate-400">Published Exams</p>
            <p className="mt-3 text-3xl font-bold text-white" data-testid="super-admin-exam-count">{examCount}</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
            <p className="text-sm text-slate-400">Students</p>
            <p className="mt-3 text-3xl font-bold text-white" data-testid="super-admin-student-count">{studentCount}</p>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-950/80 p-6 text-slate-300">
          <h2 className="text-xl font-semibold text-white">Welcome back, Super Admin</h2>
          <p className="mt-2 text-slate-400">
            Your platform is operating normally. Use the menu options to manage schools, review exam activity, and monitor completion rates.
          </p>
        </div>
      </div>
    </main>
  )
}
