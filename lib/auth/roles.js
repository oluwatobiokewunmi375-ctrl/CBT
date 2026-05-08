export function getRole(user) {
  return user?.user_metadata?.role || 'student'
}

export function isAdmin(user) {
  return getRole(user) === 'admin'
}

export function isStudent(user) {
  return getRole(user) === 'student'
}

export function isTeacher(user) {
  return getRole(user) === 'teacher'
}
