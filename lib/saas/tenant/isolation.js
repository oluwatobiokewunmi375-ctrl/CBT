export function isolateQuery(query, tenant) {
  return {
    ...query,
    schoolId: tenant.schoolId
  }
}
