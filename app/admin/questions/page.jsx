'use client'

import { useState } from 'react'
import { addQuestion } from '@/lib/admin/questionBuilderService'

export default function QuestionBuilder() {
  const [examId, setExamId] = useState('')
  const [question, setQuestion] = useState('')
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [c, setC] = useState('')
  const [d, setD] = useState('')
  const [answer, setAnswer] = useState('')

  const submit = async () => {
    await addQuestion({
      exam_id: examId,
      question,
      option_a: a,
      option_b: b,
      option_c: c,
      option_d: d,
      answer
    })

    alert('Question saved')
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Question Builder</h1>

      <input placeholder='Exam ID' onChange={(e) => setExamId(e.target.value)} />
      <input placeholder='Question' onChange={(e) => setQuestion(e.target.value)} />

      <input placeholder='Option A' onChange={(e) => setA(e.target.value)} />
      <input placeholder='Option B' onChange={(e) => setB(e.target.value)} />
      <input placeholder='Option C' onChange={(e) => setC(e.target.value)} />
      <input placeholder='Option D' onChange={(e) => setD(e.target.value)} />

      <input placeholder='Correct Answer (A/B/C/D)' onChange={(e) => setAnswer(e.target.value)} />

      <button onClick={submit}>Save Question</button>
    </div>
  )
}
