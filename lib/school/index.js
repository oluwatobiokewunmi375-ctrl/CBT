export function createSchool(name) {
  return {
    id: Date.now().toString(),
    name,
    createdAt: new Date().toISOString()
  }
}

export function attachSchool(user, schoolId) {
  return {
    ...user,
    schoolId
  }
}