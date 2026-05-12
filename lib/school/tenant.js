export function withSchoolFilter(query, schoolId) {
  return query.eq("school_id", schoolId)
}