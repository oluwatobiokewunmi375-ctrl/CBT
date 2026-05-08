export function generateCurriculum(data) {
  return {
    curriculum: 'AUTO_ADAPTED',
    topics: data.weakAreas || [],
    status: 'UPDATED'
  }
}
