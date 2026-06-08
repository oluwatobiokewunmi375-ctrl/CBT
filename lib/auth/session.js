export function saveSession(user) {
  const roleLower = (user?.role || '').toString().toLowerCase()

  // Students should use Student Exam login mode, not Dashboard
  if (roleLower === 'student') {
    return null  // Dashboard login not available for students
  }

  // return suggested post-login path; caller should perform navigation using router
  if (roleLower === "super_admin" || roleLower === "super-admin") {
    return "/super-admin/dashboard"
  }

  if (
    roleLower === "school_admin" ||
    roleLower === "school-admin" ||
    roleLower === 'teacher' ||
    roleLower === 'admin'
  ) {
    return "/admin/dashboard"
  }

  // Unknown role defaults to dashboard (should not happen in normal flow)
  return "/dashboard"
}