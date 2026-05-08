'use client'

import { useState } from 'react'
import { createExam } from '@/lib/admin/examAdminService'

export default function CreateExam() {
  const [title, setTitle] = useState('')

  const submit = async () => {
    await createExam({
      title,
      status: 'draft'
    })

    alert('Exam created')
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Create Exam</h1>

      <input
        placeholder='Exam Title'
        onChange={(e) => setTitle(e.target.value)}
      />

      <button onClick={submit}>Create</button>
    </div>
  )
}
