import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/middleware";
import { hash } from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 403 });

    const body = await req.json();
    const { email, password, fullName, role } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "email, password and fullName required" }, { status: 400 });
    }

    // Determine school context
    let schoolId = decoded.schoolId;
    if (decoded.role === 'SUPER_ADMIN' && body.schoolId) schoolId = body.schoolId;

    if (!schoolId) return NextResponse.json({ error: "School context required" }, { status: 400 });

    // Only SUPER_ADMIN or SCHOOL_ADMIN can create school-scoped admins
    if (!['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized - school admin access required' }, { status: 403 });
    }

    // Only SUPER_ADMIN may create SCHOOL_ADMIN; otherwise force role to ADMIN
    let finalRole: 'ADMIN' | 'SCHOOL_ADMIN' | 'SUPER_ADMIN' | 'STUDENT' = 'ADMIN';
    if (role && decoded.role === 'SUPER_ADMIN') {
      finalRole = role === 'SCHOOL_ADMIN' ? 'SCHOOL_ADMIN' : 'ADMIN';
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'User already exists' }, { status: 409 });

    const hashed = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        fullName,
        role: finalRole as any,
        schoolId,
      },
    });

    return NextResponse.json({ success: true, admin: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } }, { status: 201 });
  } catch (error) {
    console.error('Create school admin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 403 });

    // Allow SUPER_ADMIN to optionally pass ?schoolId= to inspect other schools
    let schoolId = decoded.schoolId;
    const url = new URL(req.url);
    const qSchool = url.searchParams.get("schoolId");
    if (decoded.role === "SUPER_ADMIN" && qSchool) schoolId = qSchool;

    if (!schoolId) {
      return NextResponse.json({ error: "School context required" }, { status: 400 });
    }

    // Only allow SUPER_ADMIN and SCHOOL_ADMIN to access this
    if (!["SUPER_ADMIN", "SCHOOL_ADMIN"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized - school admin access required" }, { status: 403 });
    }

    const admins = await prisma.user.findMany({
      where: {
        schoolId,
        role: { in: ["ADMIN", "SCHOOL_ADMIN"] },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, admins });
  } catch (error) {
    console.error("Get school admins error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
