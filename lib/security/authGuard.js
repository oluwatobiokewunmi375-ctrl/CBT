import { supabase } from '../supabase/client'

export async function requireAuth(req) {
  const token = req.headers.get('authorization')

  if (!token) {
    return { error: 'Unauthorized' }
  }

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    return { error: 'Invalid session' }
  }

  return { user: data.user }
}
