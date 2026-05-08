export async function GET() {
  return Response.json({
    errors: 2,
    events: 128,
    latency: 220,
    requests: 540
  })
}
