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
    if (!decoded || decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - super admin access required" },
        { status: 403 }
      );
    }

    const { email, password, fullName, schoolId } = await req.json();

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

    // Create user with SCHOOL_ADMIN role and assign to the specified school
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role: "SCHOOL_ADMIN",
        schoolId: school.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        admin: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          schoolId: school.id,
          schoolName: school.name,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create admin error:", error);
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
    if (!decoded || decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - super admin access required" },
        { status: 403 }
      );
    }

    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SCHOOL_ADMIN"] } },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        schoolId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, admins });
  } catch (error) {
    console.error("Get admins error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}