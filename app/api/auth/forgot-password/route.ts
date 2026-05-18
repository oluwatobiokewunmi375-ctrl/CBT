import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signJwtToken } from "@/lib/auth/jwt";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) {
      return NextResponse.json({ success: true, message: "If that email exists, a reset link has been issued." });
    }

    const token = signJwtToken(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        type: "password_reset",
      },
      "1h"
    );

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;

    // TODO: wire up SMTP email delivery for password resets.
    return NextResponse.json({
      success: true,
      message: "Password reset token generated.",
      resetUrl,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
