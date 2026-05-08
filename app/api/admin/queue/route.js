export async function GET() {
  return Response.json([
    {
      id: 'job_1',
      type: 'EXAM_SUBMISSION',
      status: 'PENDING'
    }
  ])
}
