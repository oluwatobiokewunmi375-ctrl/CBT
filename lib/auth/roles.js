export const ROLES = {
  SUPER_ADMIN: "super_admin",
  SCHOOL_ADMIN: "school_admin",
  STUDENT: "student"
}

export function getRedirect(role) {
  if (role === ROLES.SUPER_ADMIN) return "/super-admin"
  if (role === ROLES.SCHOOL_ADMIN) return "/admin/dashboard"
  return "/dashboard"
}