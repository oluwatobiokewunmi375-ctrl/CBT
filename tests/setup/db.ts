import { exec } from "child_process";
import { promisify } from "util";
import { prisma } from "@/lib/prisma";

const execAsync = promisify(exec);

/**
 * Initialize test database:
 * - Set test DATABASE_URL to SQLite
 * - Push schema to database (create tables)
 * - Seed with test data
 */
export async function setupTestDatabase() {
  try {
    // Ensure DATABASE_URL points to test database
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = "file:./test.db";
    }

    // Push Prisma schema to test DB (creates tables if not exist)
    console.log("🔄 Setting up test database...");
    try {
      await execAsync("npx prisma db push --skip-generate --skip-validate");
    } catch (error) {
      console.warn("⚠️ Prisma db push warning (may already be synced):", error);
    }

    // Create seed data
    await seedTestData();

    console.log("✅ Test database ready");
  } catch (error) {
    console.error("❌ Failed to setup test database:", error);
    throw error;
  }
}


/**
 * Seed test data for unit tests
 */
export async function seedTestData() {
  try {
    // Create demo school
    const school = await prisma.school.upsert({
      where: { shortCode: "DEMO" },
      update: {},
      create: {
        shortCode: "DEMO",
        name: "Demo School",
        motto: "Excellence in Education",
        address: "123 Test Street",
        principal: "Dr. Test",
      },
    });

    // Create test users
    const { hash } = await import("bcryptjs");
    const hashedPassword = await hash("password123", 12);

    // Student
    const studentUser = await prisma.user.upsert({
      where: { email: "student@demo.com" },
      update: {},
      create: {
        email: "student@demo.com",
        password: hashedPassword,
        fullName: "Test Student",
        role: "STUDENT",
        schoolId: school.id,
      },
    });

    await prisma.student.upsert({
      where: { studentNo: "STU0001" },
      update: { userId: studentUser.id },
      create: {
        userId: studentUser.id,
        studentNo: "STU0001",
        schoolId: school.id,
      },
    });

    // Teacher
    const teacherUser = await prisma.user.upsert({
      where: { email: "teacher@demo.com" },
      update: {},
      create: {
        email: "teacher@demo.com",
        password: hashedPassword,
        fullName: "Test Teacher",
        role: "TEACHER",
        schoolId: school.id,
      },
    });

    await prisma.teacher.upsert({
      where: { userId: teacherUser.id },
      update: {},
      create: {
        userId: teacherUser.id,
        schoolId: school.id,
        employeeNo: "TCH0001",
      },
    });

    // Admin
    const adminUser = await prisma.user.upsert({
      where: { email: "admin@demo.com" },
      update: {},
      create: {
        email: "admin@demo.com",
        password: hashedPassword,
        fullName: "Admin User",
        role: "ADMIN",
        schoolId: school.id,
      },
    });

    console.log("✅ Test data seeded");
  } catch (error) {
    console.warn("⚠️  Test data seed skipped (may already exist):", error);
  }
}

/**
 * Clean up test database after tests
 */
export async function teardownTestDatabase() {
  try {
    console.log("🧹 Cleaning up test database...");
    
    // Delete all data in reverse order of dependencies
    await prisma.session.deleteMany({});
    await prisma.result.deleteMany({});
    await prisma.exam.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.teacher.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.school.deleteMany({});

    console.log("✅ Test database cleaned");
  } catch (error) {
    console.warn("⚠️  Cleanup error:", error);
  }
}

/**
 * Reset database between test files
 */
export async function resetTestDatabase() {
  try {
    // Delete all data
    await prisma.session.deleteMany({});
    await prisma.result.deleteMany({});
    await prisma.exam.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.teacher.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.user.deleteMany({});
    
    // Re-seed
    await seedTestData();
  } catch (error) {
    console.warn("⚠️  Reset error:", error);
  }
}
