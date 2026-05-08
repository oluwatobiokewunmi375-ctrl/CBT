import { supabase } from '../supabase/client'

export async function dbQuery(table) {
  return supabase.from(table)
}

export async function getSchoolData(schoolId) {
  return supabase
    .from('schools')
    .select('*')
    .eq('id', schoolId)
}
