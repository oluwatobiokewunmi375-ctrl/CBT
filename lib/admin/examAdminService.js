import { supabase } from '@/lib/supabase/client'

// CREATE EXAM
export async function createExam(data) {
  return await supabase.from('exams').insert([data])
}

// GET ALL EXAMS
export async function getExams() {
  return await supabase.from('exams').select('*')
}

// UPDATE EXAM STATUS
export async function updateExam(id, updates) {
  return await supabase
    .from('exams')
    .update(updates)
    .eq('id', id)
}
