import { NextRequest, NextResponse } from "next/server";
import seedExam from "@/lib/seedExam";

export async function POST(req: NextRequest) {
  try {
    // Simple authentication - in production, use proper auth
    const { key } = await req.json();

    if (key !== "CBT_SEED_2024") {
      return NextResponse.json(
        { error: "Invalid seed key" },
        { status: 403 }
      );
    }

    await seedExam();

    return NextResponse.json(
      {
        success: true,
        message: "Database seeded successfully",
        accounts: {
          superAdmin: "adebayosamuel015@gmail.com / Hibilero@2104",
          schoolAdmin: "admin@test.com / admin123",
          teacher: "teacher@test.com / teacher123",
          students: "student1@test.com to student10@test.com / student123",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Seeding failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}