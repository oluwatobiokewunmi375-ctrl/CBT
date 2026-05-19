import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/middleware";
import { hash } from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !["ADMIN", "SCHOOL_ADMIN", "SUPER_ADMIN"].includes(decoded.role)) {
      return NextResponse.json(
        { error: "Unauthorized - admin access required" },
        { status: 403 }
      );
    }

    const parsed = await req.json();
    let { email, password, fullName, schoolId, studentNo } = parsed;

    if (!schoolId && decoded.role === "SCHOOL_ADMIN") {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      }) as { schoolId?: string } | null;
      schoolId = user?.schoolId || schoolId;
    }

    if (!email || !password || !fullName || !schoolId) {
      return NextResponse.json(
        { error: "email, password, fullName, and schoolId required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
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

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role: "STUDENT",
      },
    });

    // Create student record
    const student = await prisma.student.create({
      data: {
        userId: user.id,
        schoolId: school.id,
        studentNo: studentNo || `STU-${Date.now()}`,
      },
      include: {
        user: true,
        school: true,
      },
    });

    return NextResponse.json(
      { success: true, student },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create student error:", error);
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
    if (!decoded || !["ADMIN", "SCHOOL_ADMIN", "SUPER_ADMIN", "TEACHER"].includes(decoded.role)) {
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

    // SUPER_ADMIN can view all students or filter by schoolId
    if (!schoolId && decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "schoolId query parameter required" },
        { status: 400 }
      );
    }

    const students = await prisma.student.findMany({
      where: schoolId ? { schoolId } : {}, // Get all students if schoolId is undefined (SUPER_ADMIN)
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
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
      },
    });

    return NextResponse.json({ success: true, students });

    const students = await prisma.student.findMany({
      where: schoolId ? { schoolId } : {}, // Get all students if schoolId is undefined (SUPER_ADMIN)
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
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
      },
    });

    return NextResponse.json({ success: true, students });
  } catch (error) {
    console.error("Get students error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}