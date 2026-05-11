export async function POST(req) {
  try {
    const body = await req.json()

    return Response.json({
      success: true,
      message: "Login endpoint working",
      user: {
        email: body.email || "demo@example.com"
      }
    })
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: "Login failed"
      },
      { status: 500 }
    )
  }
}
