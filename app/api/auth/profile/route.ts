import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/middleware";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get user with student details
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        student: {
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
            results: {
              select: {
                exam: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
                score: true,
                percentage: true,
                grade: true,
              },
              take: 10,
              orderBy: { createdAt: "desc" },
            },
          },
        },
        teacher: {
          include: {
            school: {
              select: {
                id: true,
                name: true,
              },
            },
            classRoom: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        school: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        school: user.school
          ? {
              id: user.school.id,
              name: user.school.name,
              shortCode: user.school.shortCode,
              logoUrl: user.school.logoUrl,
              bannerUrl: user.school.bannerUrl,
              theme: user.school.theme,
            }
          : user.teacher?.school
          ? {
              id: user.teacher.school.id,
              name: user.teacher.school.name,
            }
          : null,
        student: user.student
          ? {
              id: user.student.id,
              studentNo: user.student.studentNo,
              school: user.student.school,
              classRoom: user.student.ClassRoom,
              recentResults: user.student.results,
              averageScore:
                user.student.results.length > 0
                  ? (
                      user.student.results.reduce((sum, r) => sum + r.score, 0) /
                      user.student.results.length
                    ).toFixed(2)
                  : 0,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



