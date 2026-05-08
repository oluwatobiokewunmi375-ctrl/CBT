import { supabase } from '@/lib/supabase/client'

// ASSIGN EXAM TO STUDENT
export async function assignExamToStudent(studentId, examId) {
  return await supabase.from('assignments').insert([
    {
      student_id: studentId,
      exam_id: examId,
      status: 'assigned'
    }
  ])
}

// GET STUDENT ASSIGNED EXAMS
export async function getStudentExams(studentId) {
  return await supabase
    .from('assignments')
    .select('*')
    .eq('student_id', studentId)
}
