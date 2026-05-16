import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/middleware";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 403 });

    const id = params.id;
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Do not allow deleting SUPER_ADMIN
    if (target.role === 'SUPER_ADMIN') return NextResponse.json({ error: 'Cannot delete SUPER_ADMIN' }, { status: 403 });

    // SCHOOL_ADMIN can only delete admins in their school
    if (decoded.role === 'SCHOOL_ADMIN') {
      if (!decoded.schoolId || target.schoolId !== decoded.schoolId) {
        return NextResponse.json({ error: 'Unauthorized - cannot delete user outside your school' }, { status: 403 });
      }
    }

    // SUPER_ADMIN can delete anyone (except other SUPER_ADMIN handled above)
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (error) {
    console.error('Delete school admin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
