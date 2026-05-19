import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return NextResponse.json({ error: "Invalid verification token" }, { status: 400 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: true, message: "Email address is already verified." });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    return NextResponse.json({ success: true, message: "Email verified successfully." });
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
