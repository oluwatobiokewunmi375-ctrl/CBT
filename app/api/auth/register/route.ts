import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { signJwtToken } from "@/lib/auth/jwt";
import { verifyToken } from "@/lib/auth/middleware";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { checkRateLimit } from "@/lib/security/rateLimit";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z
    .string()
    .optional()
    .transform((value) => (value ? value.toUpperCase() : "STUDENT")),
  schoolCode: z.string().optional(),
  classRoomId: z.string().optional(),
  dob: z.string().optional(),
  gender: z.string().optional(),
  profileImage: z.string().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  parentEmail: z.string().email().optional(),
  address: z.string().optional(),
  employeeNo: z.string().optional(),
  department: z.string().optional(),
});

async function generateStudentNo(schoolId?: string): Promise<string> {
  if (schoolId) {
    const studentCount = await prisma.student.count({
      where: { schoolId },
    });
    return (studentCount + 1).toString().padStart(4, "0");
  }
  return `STU-${Date.now().toString().slice(-6)}`;
}

export async function POST(req: NextRequest) {
  try {
    if (checkRateLimit(req, "auth_register", 5, 60_000)) {
      return NextResponse.json({ error: "Too many registration attempts. Try again later." }, { status: 429 });
    }

    const authToken = req.headers.get("authorization")?.split(" ")[1] || null;
    const decoded = authToken ? verifyToken(authToken) : null;
    const isSuperAdmin = decoded?.role === "SUPER_ADMIN";

    const parsed = registerSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

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
    } = parsed.data;

    const normalizedRole = (role as string).toUpperCase() as Role;
    const allowedRoles: Role[] = ["STUDENT", "TEACHER", "ADMIN", "SCHOOL_ADMIN", "SUPER_ADMIN"];

    if (!allowedRoles.includes(normalizedRole)) {
      return NextResponse.json({ error: `Invalid role. Allowed roles: ${allowedRoles.join(", ")}` }, { status: 400 });
    }

    if (["SUPER_ADMIN", "ADMIN", "SCHOOL_ADMIN"].includes(normalizedRole) && !isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized to create this type of account" }, { status: 403 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    let school = null;
    if (schoolCode) {
      const normalizedSchoolCode = schoolCode.toUpperCase();
      school = await prisma.school.findUnique({ where: { shortCode: normalizedSchoolCode } });
      if (!school && ["STUDENT", "TEACHER"].includes(normalizedRole)) {
        school = await prisma.school.create({
          data: {
            shortCode: normalizedSchoolCode,
            name: `${normalizedSchoolCode} School`,
            motto: "Self-registered school",
            address: "Auto-generated school registration",
          },
        });
      }
      if (!school) {
        return NextResponse.json({ error: "School code not found" }, { status: 404 });
      }
    }

    if (["STUDENT", "TEACHER"].includes(normalizedRole) && !school) {
      return NextResponse.json({ error: "School code is required for student and teacher registration" }, { status: 400 });
    }

    if (["ADMIN", "SCHOOL_ADMIN"].includes(normalizedRole) && !school) {
      return NextResponse.json({ error: "School code is required for admin and school admin registration" }, { status: 400 });
    }

    let classRoom = null;
    if (classRoomId) {
      classRoom = await prisma.classRoom.findUnique({ where: { id: classRoomId } });
      if (!classRoom || (school && classRoom.schoolId !== school.id)) {
        return NextResponse.json({ error: "Classroom does not belong to the selected school" }, { status: 400 });
      }
    }

    const hashedPassword = await hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role: normalizedRole,
        schoolId: school?.id,
      },
    });

    let student = null;
    let teacher = null;

    if (normalizedRole === "STUDENT") {
      const generatedStudentNo = await generateStudentNo(school?.id);
      student = await prisma.student.create({
        data: {
          userId: user.id,
          schoolId: school?.id,
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
          ClassRoom: true,
        },
      });
    }

    if (normalizedRole === "TEACHER") {
      teacher = await prisma.teacher.create({
        data: {
          userId: user.id,
          schoolId: school?.id,
          employeeNo: employeeNo || `TCH-${school?.shortCode ?? "GEN"}-${Date.now().toString().slice(-6)}`,
          department: department || undefined,
          classRoomId: classRoomId || undefined,
        },
        include: {
          school: true,
          classRoom: true,
        },
      });
    }

    const token = signJwtToken({
      id: user.id,
      email: user.email,
      role: user.role,
      studentId: student?.id,
      teacherId: teacher?.id,
      schoolId: school?.id,
      type: "auth",
    });

    const verificationToken = signJwtToken({
      id: user.id,
      email: user.email,
      role: user.role,
      type: "email_verification",
    }, "1d");

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}`;

    const response = NextResponse.json(
      {
        success: true,
        token,
        verificationUrl,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          school: school
            ? {
                id: school.id,
                name: school.name,
                shortCode: school.shortCode,
                logoUrl: school.logoUrl,
                bannerUrl: school.bannerUrl,
                theme: school.theme,
              }
            : null,
          student: student
            ? {
                id: student.id,
                studentNo: student.studentNo,
                school: student.school,
                classRoom: student.ClassRoom,
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

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
