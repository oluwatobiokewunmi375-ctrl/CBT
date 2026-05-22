import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTokenFromRequest } from "@/lib/auth/middleware";

export async function PATCH(req: NextRequest) {
  try {
    const decoded = verifyTokenFromRequest(req);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    if (decoded.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const url = new URL(req.url);
    const parts = url.pathname.split("/");
    const id = parts[parts.length - 1];

    const body = await req.json();
    const action = body.action || "update";

    if (action === "update") {
      const { name, shortCode, motto, address, principal, logoUrl, bannerUrl, theme } = body;
      if (!name || !shortCode) {
        return NextResponse.json({ error: "name and shortCode required" }, { status: 400 });
      }
      const updated = await prisma.school.update({ where: { id }, data: { name, shortCode, motto, address, principal, logoUrl, bannerUrl, theme } });
      return NextResponse.json({ success: true, school: updated });
    }

    if (action === "disable") {
      const updated = await prisma.school.update({ where: { id }, data: { deletedAt: new Date() } });
      return NextResponse.json({ success: true, school: updated });
    }

    if (action === "enable") {
      const updated = await prisma.school.update({ where: { id }, data: { deletedAt: null } });
      return NextResponse.json({ success: true, school: updated });
    }

    if (action === "hard-delete") {
      // Ensure no dependent critical records
      const studentCount = await prisma.student.count({ where: { schoolId: id } });
      const examCount = await prisma.exam.count({ where: { schoolId: id } });
      if (studentCount > 0 || examCount > 0) {
        return NextResponse.json({ error: "Cannot delete school with students or exams" }, { status: 400 });
      }
      await prisma.school.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("School admin action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const decoded = verifyTokenFromRequest(req);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    if (decoded.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const url = new URL(req.url);
    const parts = url.pathname.split("/");
    const id = parts[parts.length - 1];

    const studentCount = await prisma.student.count({ where: { schoolId: id } });
    const examCount = await prisma.exam.count({ where: { schoolId: id } });
    if (studentCount > 0 || examCount > 0) {
      return NextResponse.json({ error: "Cannot delete school with students or exams" }, { status: 400 });
    }

    await prisma.school.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete school error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
