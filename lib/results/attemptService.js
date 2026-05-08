import { supabase } from '@/lib/supabase/client'

// START EXAM ATTEMPT
export async function startAttempt(studentId, examId) {
  return await supabase.from('attempts').insert([
    {
      student_id: studentId,
      exam_id: examId,
      started_at: new Date()
    }
  ])
}

// END EXAM ATTEMPT
export async function endAttempt(attemptId) {
  return await supabase
    .from('attempts')
    .update({ ended_at: new Date() })
    .eq('id', attemptId)
}
