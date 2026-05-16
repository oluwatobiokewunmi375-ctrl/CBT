export function saveSession(user) {
  const roleLower = (user?.role || '').toString().toLowerCase()
  localStorage.setItem("role", roleLower)
  localStorage.setItem("userId", user.id)
  localStorage.setItem("schoolId", user.school_id)

  // return suggested post-login path; caller should perform navigation using router
  if (roleLower === "super_admin" || roleLower === "super-admin") {
    return "/super-admin/dashboard"
  }

  if (roleLower === "school_admin" || roleLower === "school-admin" || roleLower === 'teacher') {
    return "/admin/dashboard"
  }

  return "/dashboard"
}