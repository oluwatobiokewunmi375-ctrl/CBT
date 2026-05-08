import { supabase } from '@/lib/supabase/client'

// PUBLISH EXAM
export async function publishExam(examId) {
  return await supabase
    .from('exams')
    .update({ status: 'published' })
    .eq('id', examId)
}

// UNPUBLISH EXAM
export async function unpublishExam(examId) {
  return await supabase
    .from('exams')
    .update({ status: 'draft' })
    .eq('id', examId)
}

// ARCHIVE EXAM
export async function archiveExam(examId) {
  return await supabase
    .from('exams')
    .update({ status: 'archived' })
    .eq('id', examId)
}
