import { createToken } from "../../../lib/auth"

export async function POST(req) {
  const body = await req.json()

  const user = {
    id: Date.now(),
    email: body.email,
    role: body.role || "student"
  }

  const token = createToken(user)

  return Response.json({
    user,
    token
  })
}
