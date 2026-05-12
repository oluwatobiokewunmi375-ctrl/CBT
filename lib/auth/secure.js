import { supabase } from "../supabase/client"

export async function getUser() {
  const { data } = await supabase.auth.getUser()
  return data?.user
}

export function requireRole(user, role) {
  return user?.user_metadata?.role === role
}