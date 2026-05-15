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

    const { studentId, classRoomId } = await req.json();

    if (!studentId || !classRoomId) {
      return NextResponse.json(
        { error: "studentId and classRoomId required" },
        { status: 400 }
      );
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Check if classroom exists
    const classRoom = await prisma.classRoom.findUnique({
      where: { id: classRoomId },
      include: { school: true },
    });

    if (!classRoom) {
      return NextResponse.json(
        { error: "Classroom not found" },
        { status: 404 }
      );
    }

    // Check if student belongs to the same school as the classroom
    if (student.schoolId !== classRoom.schoolId) {
      return NextResponse.json(
        { error: "Student and classroom must belong to the same school" },
        { status: 400 }
      );
    }

    // Update student's classroom
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: { classRoomId },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
        classRoom: {
          select: {
            id: true,
            name: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, student: updatedStudent },
      { status: 200 }
    );
  } catch (error) {
    console.error("Assign student to classroom error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}