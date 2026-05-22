export function getRedirectPath(role) {
  // Normalize role string for safety
  const r = (role || '').toString().toLowerCase()
  if (r === "super_admin" || r === "super-admin") return "/super-admin/dashboard"
  if (r === "school_admin" || r === "school-admin") return "/admin/dashboard"
  if (r === "admin") return "/admin/dashboard"
  return "/dashboard"
}