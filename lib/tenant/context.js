export function getTenant(user) {
  return {
    schoolId: user?.user_metadata?.school_id,
    userId: user?.id,
    role: user?.role
  }
}
