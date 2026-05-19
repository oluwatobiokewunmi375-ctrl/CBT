import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken, signJwtToken } from "@/lib/auth/jwt";
import { hash } from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const decoded = verifyJwtToken(parsed.data.token);
    if (!decoded || decoded.type !== "password_reset") {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.passwordResetRequestedAt) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    const tokenIssuedAt = decoded.issuedAt ? new Date(decoded.issuedAt) : null;
    const requestedAtSeconds = Math.floor(user.passwordResetRequestedAt.getTime() / 1000);
    const tokenIssuedAtSeconds = tokenIssuedAt ? Math.floor(tokenIssuedAt.getTime() / 1000) : 0;

    if (!tokenIssuedAt || tokenIssuedAtSeconds < requestedAtSeconds) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    const hashedPassword = await hash(parsed.data.password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetRequestedAt: null,
      },
    });

    return NextResponse.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
