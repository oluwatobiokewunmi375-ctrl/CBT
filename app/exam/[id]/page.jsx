'use client'
import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"

export default function ExamPage() {
  const { id } = useParams()
  const [timeLeft, setTimeLeft] = useState(60)
  const intervalRef = useRef(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(intervalRef.current)
          submit()
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [])

  const submit = async () => {
    await fetch("/api/exam/submit", {
      method: "POST",
      body: JSON.stringify({ examId: id, type: "auto" })
    })
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>EXAM</h1>
      <h2>Time Left: {timeLeft}</h2>
    </div>
  )
}