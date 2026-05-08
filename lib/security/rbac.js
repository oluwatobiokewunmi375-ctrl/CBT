export function checkRole(user, allowedRoles = []) {
  if (!user?.role) return false
  return allowedRoles.includes(user.role)
}
