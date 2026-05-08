export function getTenantContext(request) {
  const schoolId =
    request.headers.get('x-school-id') ||
    request.nextUrl?.searchParams?.get('schoolId')

  return {
    schoolId: schoolId || 'GLOBAL_DEFAULT',
    isolated: true
  }
}
