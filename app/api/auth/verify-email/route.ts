import { NextRequest, NextResponse } from "next/server";
import { verifyJwtToken } from "@/lib/auth/jwt";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const decoded = verifyJwtToken(parsed.data.token);
    if (!decoded || decoded.type !== "email_verification") {
      return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Email verification token is valid." });
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
