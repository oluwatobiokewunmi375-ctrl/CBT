const schools = []

export function registerSchool(school) {
  schools.push({
    id: school.id,
    name: school.name,
    createdAt: Date.now()
  })

  return schools
}

export function listSchools() {
  return schools
}
