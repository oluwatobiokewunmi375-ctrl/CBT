export const db = {
  schools: [],
  users: [],
  exams: [],
  questions: [],
  results: []
}

export function getSchoolData(schoolId) {
  return {
    exams: db.exams.filter(e => e.schoolId === schoolId),
    students: db.users.filter(u => u.schoolId === schoolId),
    questions: db.questions.filter(q => q.schoolId === schoolId)
  }
}