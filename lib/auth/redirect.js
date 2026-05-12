export function getRedirectPath(role) {
  if (role === "super_admin") return "/admin/dashboard"
  if (role === "school_admin") return "/admin/dashboard"
  return "/dashboard"
}