'use client'
import { useRouter } from "next/navigation"

export default function AdminDashboard() {
  const router = useRouter()

  return (
    <div style={{ padding: 20 }}>
      <h1>ADMIN (SCHOOL CONTROL PANEL)</h1>

      <button onClick={() => router.push("/admin/exams")}>
        Manage Exams
      </button>

      <button onClick={() => router.push("/admin/students")}>
        Manage Students
      </button>

      <button onClick={() => router.push("/admin/live")}>
        Live Monitoring
      </button>
    </div>
  )
}