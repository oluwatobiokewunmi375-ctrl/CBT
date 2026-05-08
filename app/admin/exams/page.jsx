'use client'

import { useEffect, useState } from 'react'
import { getExams } from '@/lib/admin/examAdminService'

export default function AdminExams() {
  const [exams, setExams] = useState([])

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const { data } = await getExams()
    setExams(data || [])
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Admin Exam Dashboard</h1>

      {exams.map((exam) => (
        <div key={exam.id} style={{ margin: 10, padding: 10, border: '1px solid #ccc' }}>
          <h3>{exam.title}</h3>
          <p>Status: {exam.status || 'draft'}</p>
        </div>
      ))}
    </div>
  )
}
