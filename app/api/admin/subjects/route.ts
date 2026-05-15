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
    if (!decoded || !["ADMIN", "SUPER_ADMIN", "TEACHER"].includes(decoded.role)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { name, code, schoolId, classRoomId } = await req.json();

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

    // Create subject
    const subject = await prisma.subject.create({
      data: {
        name,
        code,
        schoolId,
        classRoomId: classRoomId || null,
      },
      include: {
        school: true,
        ClassRoom: true,
      },
    });

    return NextResponse.json(
      { success: true, subject },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create subject error:", error);
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
    if (!decoded || !["ADMIN", "SUPER_ADMIN", "TEACHER", "STUDENT"].includes(decoded.role)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { schoolId } = Object.fromEntries(new URL(req.url).searchParams);

    if (!schoolId) {
      return NextResponse.json(
        { error: "schoolId query parameter required" },
        { status: 400 }
      );
    }

    const subjects = await prisma.subject.findMany({
      where: { schoolId },
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        ClassRoom: {
          select: {
            id: true,
            name: true,
          },
        },
        exams: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        _count: {
          select: {
            exams: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, subjects });
  } catch (error) {
    console.error("Get subjects error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}