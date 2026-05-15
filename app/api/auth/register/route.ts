import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Generate school-specific student ID numbers
async function generateStudentNo(schoolId: string): Promise<string> {
  const studentCount = await prisma.student.count({
    where: { schoolId },
  });
  const nextNumber = studentCount + 1;
  return nextNumber.toString().padStart(4, "0");
}

export async function POST(req: NextRequest) {
  try {
    const {
      email,
      password,
      fullName,
      role,
      schoolCode,
      classRoomId,
      dob,
      gender,
      profileImage,
      parentName,
      parentPhone,
      parentEmail,
      address,
      employeeNo,
      department,
    } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Email, password, and fullName required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    let school = null;
    if (schoolCode) {
      school = await prisma.school.findUnique({
        where: { shortCode: schoolCode },
      });
      if (!school) {
        return NextResponse.json(
          { error: "School code not found" },
          { status: 404 }
        );
      }
    }

    let classRoom = null;
    if (classRoomId) {
      classRoom = await prisma.classRoom.findUnique({
        where: { id: classRoomId },
      });
      if (!classRoom || (school && classRoom.schoolId !== school.id)) {
        return NextResponse.json(
          { error: "Classroom does not belong to the selected school" },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role: role || "STUDENT",
      },
    });

    let student = null;
    let teacher = null;

    if (user.role === "STUDENT" && school) {
      const generatedStudentNo = await generateStudentNo(school.id);
      student = await prisma.student.create({
        data: {
          userId: user.id,
          schoolId: school.id,
          studentNo: generatedStudentNo,
          classRoomId: classRoomId || undefined,
          dob: dob ? new Date(dob) : undefined,
          gender: gender || undefined,
          profileImage: profileImage || undefined,
          parentName: parentName || undefined,
          parentPhone: parentPhone || undefined,
          parentEmail: parentEmail || undefined,
          address: address || undefined,
        },
        include: {
          school: true,
          classRoom: true,
        },
      });
    }

    if (user.role === "TEACHER" && school) {
      teacher = await prisma.teacher.create({
        data: {
          userId: user.id,
          schoolId: school.id,
          employeeNo:
            employeeNo ||
            `TCH-${school.shortCode}-${Date.now().toString().slice(-6)}`,
          department: department || undefined,
          classRoomId: classRoomId || undefined,
        },
        include: {
          school: true,
          classRoom: true,
        },
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        studentId: student?.id,
        teacherId: teacher?.id,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          student: student
            ? {
                id: student.id,
                studentNo: student.studentNo,
                school: student.school,
                classRoom: student.classRoom,
              }
            : null,
          teacher: teacher
            ? {
                id: teacher.id,
                employeeNo: teacher.employeeNo,
                department: teacher.department,
                school: teacher.school,
                classRoom: teacher.classRoom,
              }
            : null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
