import { supabase } from '@/lib/supabase/client'

// SIMPLE AUTO-GRADING ENGINE
export async function gradeExam(answers, questions) {
  let score = 0

  questions.forEach((q) => {
    const ans = answers.find(a => a.question_id === q.id)

    if (ans && ans.answer === q.answer) {
      score++
    }
  })

  return score
}

// SAVE RESULT
export async function saveResult(result) {
  return await supabase.from('results').insert([result])
}
