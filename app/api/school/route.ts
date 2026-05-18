import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/middleware";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    const decoded = token ? verifyToken(token) : null;

    const {
      name,
      shortCode,
      motto,
      address,
      principal,
      logoUrl,
      bannerUrl,
      theme,
    } = await req.json();

    if (!name || !shortCode) {
      return NextResponse.json(
        { error: "name and shortCode required" },
        { status: 400 }
      );
    }

    const existing = await prisma.school.findUnique({
      where: { shortCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: "School already exists" },
        { status: 409 }
      );
    }

    const createData: any = {
      name,
      shortCode,
      motto: motto || undefined,
      address: address || undefined,
      principal: principal || undefined,
      logoUrl: logoUrl || undefined,
      bannerUrl: bannerUrl || undefined,
      theme: theme || undefined,
    };

    if (!decoded || decoded.role !== "SUPER_ADMIN") {
      // Allow public school creation for initial registrations
      delete createData.motto;
      delete createData.principal;
      delete createData.logoUrl;
      delete createData.bannerUrl;
      delete createData.theme;
    }

    const school = await prisma.school.create({
      data: createData,
    });

    return NextResponse.json(
      { success: true, school },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create school error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const query = new URL(req.url).searchParams;
    const shortCode = query.get("shortCode");
    const token = req.headers.get("authorization")?.split(" ")[1];
    const decoded = token ? verifyToken(token) : null;

    if (shortCode) {
      const school = await prisma.school.findUnique({
        where: { shortCode },
        select: {
          id: true,
          name: true,
          shortCode: true,
          motto: true,
          address: true,
          principal: true,
          logoUrl: true,
          bannerUrl: true,
          theme: true,
        },
      });

      if (!school) {
        return NextResponse.json({ error: "School not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, school });
    }

    const includeCounts = decoded && ["SUPER_ADMIN", "ADMIN"].includes(decoded.role);

    const schools = includeCounts
      ? await prisma.school.findMany({
          include: {
            _count: {
              select: {
                students: true,
                teachers: true,
                exams: true,
              },
            },
          },
        })
      : await prisma.school.findMany();

    const publicSchools = schools.map((school) => ({
      id: school.id,
      name: school.name,
      shortCode: school.shortCode,
      motto: school.motto,
      address: school.address,
      principal: school.principal,
      logoUrl: school.logoUrl,
      bannerUrl: school.bannerUrl,
      theme: school.theme,
      _count: includeCounts ? (school as any)._count : undefined,
    }));

    return NextResponse.json({ success: true, schools: publicSchools });
  } catch (error) {
    console.error("Get schools error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

