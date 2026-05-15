import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/middleware";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !["ADMIN", "SCHOOL_ADMIN", "SUPER_ADMIN", "TEACHER"].includes(decoded.role)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const parsed = await req.json();
    let { name, schoolId, subjectIds } = parsed;

    if (!schoolId && decoded.role === "SCHOOL_ADMIN") {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      }) as { schoolId?: string } | null;
      schoolId = user?.schoolId || schoolId;
    }

    if (!name || !schoolId) {
      return NextResponse.json(
        { error: "name and schoolId required" },
        { status: 400 }
      );
    }

    // Check if school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return NextResponse.json(
        { error: "School not found" },
        { status: 404 }
      );
    }

    // Create classroom
    const classRoom = await prisma.classRoom.create({
      data: {
        name,
        schoolId,
        subjects: subjectIds ? {
          connect: subjectIds.map((id: string) => ({ id })),
        } : undefined,
      },
      include: {
        subjects: true,
        school: true,
      },
    });

    return NextResponse.json(
      { success: true, classRoom },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create classroom error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !["ADMIN", "SCHOOL_ADMIN", "SUPER_ADMIN", "TEACHER", "STUDENT"].includes(decoded.role)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const query = Object.fromEntries(new URL(req.url).searchParams);
    let schoolId = query.schoolId;

    if (!schoolId) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      }) as { schoolId?: string } | null;
      schoolId = user?.schoolId || undefined;
    }

    if (!schoolId) {
      return NextResponse.json(
        { error: "schoolId query parameter required" },
        { status: 400 }
      );
    }

    const classRooms = await prisma.classRoom.findMany({
      where: { schoolId },
      include: {
        subjects: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        students: {
          select: {
            id: true,
            studentNo: true,
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, classRooms });
  } catch (error) {
    console.error("Get classrooms error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}