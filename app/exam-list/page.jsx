'use client'
import { useRouter } from "next/navigation"

export default function ExamList() {
  const router = useRouter()

  return (
    <div style={{ padding: 20 }}>
      <h1>AVAILABLE EXAMS</h1>
      <button onClick={() => router.push("/exam/1")}>
        Start Exam
      </button>
    </div>
  )
}