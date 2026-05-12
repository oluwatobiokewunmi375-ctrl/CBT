export async function POST(req) {
  const body = await req.json()

  return Response.json({
    success: true,
    result: body
  })
}
