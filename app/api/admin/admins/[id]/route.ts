import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/middleware";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized - super admin required" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (error) {
    console.error("Delete admin error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
