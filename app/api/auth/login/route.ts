import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: NextRequest) {
  try {
    const { email, password, studentNo } = await req.json();

    if (!((email && password) || studentNo)) {
      return NextResponse.json(
        { error: "Email/password or studentNo required" },
        { status: 400 }
      );
    }

    let user = null;
    let student = null;

    // Exam login: using student ID number only
    if (studentNo && !email) {
      student = await prisma.student.findUnique({
        where: { studentNo },
        include: {
          user: {
            include: {
              student: true,
              teacher: true,
            },
          },
          school: true,
          ClassRoom: true,
        },
      });

      if (!student || !student.user) {
        return NextResponse.json(
          { error: "Invalid student ID" },
          { status: 401 }
        );
      }

      user = student.user;
    } else {
      // Dashboard login: email + password
      user = await prisma.user.findUnique({
        where: { email },
        include: {
          student: {
            include: {
              school: true,
              ClassRoom: true,
            },
          },
          teacher: {
            include: {
              school: true,
              ClassRoom: true,
            },
          },
          school: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }

      const isPasswordValid = await compare(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }

      student = user.student || null;
    }

    const schoolId =
      student?.school?.id ||
      user.school?.id ||
      user.teacher?.school?.id ||
      null;

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        studentId: student?.id,
        teacherId: user.teacher?.id,
        schoolId,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const schoolData = student?.school
      ? {
          id: student.school.id,
          name: student.school.name,
          logoUrl: student.school.logoUrl,
          bannerUrl: student.school.bannerUrl,
          theme: student.school.theme,
        }
      : user.school
      ? {
          id: user.school.id,
          name: user.school.name,
          logoUrl: user.school.logoUrl,
          bannerUrl: user.school.bannerUrl,
          theme: user.school.theme,
        }
      : user.teacher?.school
      ? {
          id: user.teacher.school.id,
          name: user.teacher.school.name,
          logoUrl: user.teacher.school.logoUrl,
          bannerUrl: user.teacher.school.bannerUrl,
          theme: user.teacher.school.theme,
        }
      : null;

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        school: schoolData,
        student: student
          ? {
              id: student.id,
              studentNo: student.studentNo,
              school: student.school
                ? {
                    id: student.school.id,
                    name: student.school.name,
                    logoUrl: student.school.logoUrl,
                    bannerUrl: student.school.bannerUrl,
                    theme: student.school.theme,
                  }
                : null,
              classRoom: student.classRoom
                ? {
                    id: student.classRoom.id,
                    name: student.classRoom.name,
                  }
                : null,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


