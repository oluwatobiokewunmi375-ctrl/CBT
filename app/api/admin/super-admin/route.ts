import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, setupKey } = await req.json();

    // Setup key check from environment
    const expectedSetupKey = process.env.SUPER_ADMIN_SETUP_KEY || "CBT_SETUP_2024";
    if (setupKey !== expectedSetupKey) {
      return NextResponse.json(
        { error: "Invalid setup key" },
        { status: 403 }
      );
    }

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "email, password, and fullName required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if any super admin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
    });

    if (existingSuperAdmin) {
      return NextResponse.json(
        { error: "Super admin already exists. Use existing super admin to create additional admins." },
        { status: 409 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create super admin user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        fullName,
        role: "SUPER_ADMIN",
      },
    });

    return NextResponse.json(
      {
        success: true,
        superAdmin: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create super admin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}