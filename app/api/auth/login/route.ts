import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { signJwtToken } from "@/lib/auth/jwt";
import { z } from "zod";
import { checkRateLimit } from "@/lib/security/rateLimit";

const loginSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  studentNo: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    if (checkRateLimit(req, "auth_login", 10, 60_000)) {
      return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });
    }

    const parsed = loginSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, password, studentNo } = parsed.data;

    if (!((email && password) || studentNo)) {
      return NextResponse.json({ error: "Email/password or studentNo required" }, { status: 400 });
    }

    let user = null;
    let student = null;

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
        return NextResponse.json({ error: "Invalid student ID" }, { status: 401 });
      }

      user = student.user;
    } else {
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
              classRoom: true,
            },
          },
          school: true,
        },
      });

      if (!user) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      if (!password || !(await compare(password, user.password))) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      student = user.student || null;
    }

    const schoolId = student?.school?.id || user.school?.id || user.teacher?.school?.id || null;

    const token = signJwtToken({
      id: user.id,
      email: user.email,
      role: user.role,
      studentId: student?.id,
      teacherId: user.teacher?.id,
      schoolId,
      type: "auth",
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        school:
          student?.school != null
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
            : null,
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
              classRoom: student.ClassRoom
                ? {
                    id: student.ClassRoom.id,
                    name: student.ClassRoom.name,
                  }
                : null,
            }
          : null,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


