export async function POST(req) {
  const data = await req.json()

  // log cheating / activity
  console.log("ANTI-CHEAT EVENT:", data)

  return Response.json({ success: true })
}