export function saveSession(user, router) {
  localStorage.setItem("role", user.role)
  localStorage.setItem("userId", user.id)
  localStorage.setItem("schoolId", user.school_id)

  if (user.role === "super_admin" || user.role === "school_admin") {
    router.push("/admin/dashboard")
  } else {
    router.push("/dashboard")
  }
}