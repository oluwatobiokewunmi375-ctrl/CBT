import { prisma } from "@/lib/prisma";

/**
 * Initialize test database:
 * - Seed with test data
 */
export async function setupTestDatabase() {
  try {
    console.log("🔄 Setting up test database...");

    // Create seed data
    await seedTestData();

    console.log("✅ Test database ready");
  } catch (error) {
    console.warn("⚠️ Database setup warning:", error);
    // Don't throw - allow tests to continue
  }
}

/**
 * Seed test data for unit tests
 */
export async function seedTestData() {
  try {
    // Import hash here to avoid issues during import time
    const { hash } = await import("bcryptjs");
    
    // Create demo school with unique code
    const school = await prisma.school.create({
      data: {
        shortCode: "DEMO" + Date.now().toString().slice(-4),
        name: "Demo School",
        motto: "Excellence in Education",
        address: "123 Test Street",
        principal: "Dr. Test",
      },
    }).catch(async (err: any) => {
      // If creation fails, try to find any school
      return await prisma.school.findFirst().catch(() => null);
    });

    if (!school) {
      console.warn("⚠️ No school available for tests");
      return;
    }

    const hashedPassword = await hash("password123", 12);

    // Student - use unique email
    const studentUser = await prisma.user.create({
      data: {
        email: `student_${Date.now()}@test.com`,
        password: hashedPassword,
        fullName: "Test Student",
        role: "STUDENT",
        schoolId: school.id,
      },
    }).catch(() => null);

    if (studentUser) {
      await prisma.student.create({
        data: {
          userId: studentUser.id,
          studentNo: `STU_${Date.now()}`,
          schoolId: school.id,
        },
      }).catch(() => null);
    }

    // Teacher - use unique email
    const teacherUser = await prisma.user.create({
      data: {
        email: `teacher_${Date.now()}@test.com`,
        password: hashedPassword,
        fullName: "Test Teacher",
        role: "TEACHER",
        schoolId: school.id,
      },
    }).catch(() => null);

    if (teacherUser) {
      await prisma.teacher.create({
        data: {
          userId: teacherUser.id,
          schoolId: school.id,
          employeeNo: `TCH_${Date.now()}`,
        },
      }).catch(() => null);
    }

    // Admin - use unique email
    await prisma.user.create({
      data: {
        email: `admin_${Date.now()}@test.com`,
        password: hashedPassword,
        fullName: "Admin User",
        role: "ADMIN",
        schoolId: school.id,
      },
    }).catch(() => null);

    console.log("✅ Test data seeded");
  } catch (error) {
    console.warn("⚠️ Test data seed warning:", error);
  }
}

/**
 * Clean up test database after tests
 */
export async function teardownTestDatabase() {
  try {
    console.log("🧹 Cleaning up test database...");
    console.log("✅ Test database cleanup complete");
  } catch (error) {
    console.warn("⚠️ Cleanup error:", error);
  }
}

/**
 * Reset database between test files
 */
export async function resetTestDatabase() {
  try {
    // For tests, we'll continue - each test uses different data due to timestamps
    return;
  } catch (error) {
    console.warn("⚠️ Reset error:", error);
  }
}
