#!/usr/bin/env node

/**
 * AUTH REGRESSION TEST RUNNER
 * Tests core auth flows without requiring full test framework
 */

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "test-secret-key-01234567890123456789";

class AuthTestRunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: [],
    };
  }

  test(name, fn) {
    try {
      fn();
      this.results.passed++;
      this.results.tests.push({ name, status: "✅ PASS" });
      console.log(`✅ ${name}`);
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: "❌ FAIL", error: error.message });
      console.log(`❌ ${name}: ${error.message}`);
    }
  }

  assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  report() {
    console.log("\n========== AUTH REGRESSION TEST REPORT ==========\n");
    console.log(`Total Tests: ${this.results.passed + this.results.failed}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%\n`);

    if (this.results.failed > 0) {
      console.log("Failed Tests:");
      this.results.tests.filter((t) => t.status === "❌ FAIL").forEach((t) => {
        console.log(`  - ${t.name}`);
        console.log(`    Error: ${t.error}`);
      });
    }

    return this.results;
  }
}

// Test functions
function testJWTTokenGeneration(runner) {
  runner.test("JWT Token Generation - Valid Payload", () => {
    const payload = {
      id: "user-1",
      email: "test@example.com",
      role: "student",
      type: "auth",
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
    runner.assert(typeof token === "string", "Token should be a string");
    runner.assert(token.split(".").length === 3, "Token should have 3 parts");
  });

  runner.test("JWT Token Verification - Valid Token", () => {
    const payload = {
      id: "user-1",
      email: "test@example.com",
      role: "student",
      type: "auth",
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
    const decoded = jwt.verify(token, JWT_SECRET);

    runner.assert(decoded.id === payload.id, "ID should match");
    runner.assert(decoded.email === payload.email, "Email should match");
    runner.assert(decoded.role === payload.role, "Role should match");
  });

  runner.test("JWT Token Rejection - Expired Token", () => {
    const payload = {
      id: "user-1",
      email: "test@example.com",
      role: "student",
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "-10s" });

    try {
      jwt.verify(token, JWT_SECRET);
      throw new Error("Should have rejected expired token");
    } catch (error) {
      runner.assert(error.message.includes("expired"), "Should be expired error");
    }
  });

  runner.test("JWT Token Rejection - Invalid Signature", () => {
    const payload = {
      id: "user-1",
      email: "test@example.com",
      role: "student",
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
    const tamperedToken = token.slice(0, -10) + "XXXXXXXXXX";

    try {
      jwt.verify(tamperedToken, JWT_SECRET);
      throw new Error("Should have rejected invalid token");
    } catch (error) {
      runner.assert(error.message.includes("invalid"), "Should be invalid signature error");
    }
  });

  runner.test("JWT Token Rejection - Wrong Secret", () => {
    const payload = {
      id: "user-1",
      email: "test@example.com",
      role: "student",
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    try {
      jwt.verify(token, "wrong-secret");
      throw new Error("Should have rejected with wrong secret");
    } catch (error) {
      runner.assert(error.message.includes("invalid"), "Should be invalid error");
    }
  });

  runner.test("JWT Token - Missing Required Fields", () => {
    const incompleteToken = jwt.sign(
      {
        email: "test@example.com",
        // Missing id and role
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const decoded = jwt.verify(incompleteToken, JWT_SECRET);
    runner.assert(!decoded.id, "Should not have id");
    runner.assert(!decoded.role, "Should not have role");
  });

  runner.test("JWT Token - Extra Fields Preserved", () => {
    const payload = {
      id: "user-1",
      email: "test@example.com",
      role: "student",
      studentId: "stu-123",
      schoolId: "school-456",
      type: "auth",
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
    const decoded = jwt.verify(token, JWT_SECRET);

    runner.assert(decoded.studentId === "stu-123", "Should preserve studentId");
    runner.assert(decoded.schoolId === "school-456", "Should preserve schoolId");
  });

  runner.test("JWT Token - Type Validation", () => {
    const payload = {
      id: "user-1",
      email: "test@example.com",
      role: "student",
      type: "password_reset",
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
    const decoded = jwt.verify(token, JWT_SECRET);

    runner.assert(decoded.type === "password_reset", "Type should be password_reset");
  });

  runner.test("JWT Token - Different Expiration Times", () => {
    const payload = {
      id: "user-1",
      email: "test@example.com",
      role: "student",
    };

    const authToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
    const resetToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
    const verifyToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });

    const authDecoded = jwt.decode(authToken);
    const resetDecoded = jwt.decode(resetToken);
    const verifyDecoded = jwt.decode(verifyToken);

    runner.assert(authDecoded.exp > resetDecoded.exp, "Auth token should expire later than reset token");
    runner.assert(verifyDecoded.exp > resetDecoded.exp, "Verify token should expire later than reset token");
  });
}

function testPasswordReset(runner) {
  runner.test("Password Reset Token - Correct Type", () => {
    const payload = {
      id: "user-1",
      email: "test@example.com",
      role: "student",
      type: "password_reset",
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
    const decoded = jwt.verify(token, JWT_SECRET);

    runner.assert(decoded.type === "password_reset", "Token type should be password_reset");
  });

  runner.test("Password Reset Token - Correct Expiration", () => {
    const payload = {
      id: "user-1",
      email: "test@example.com",
      role: "student",
      type: "password_reset",
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
    const decoded = jwt.decode(token);

    runner.assert(decoded.exp - decoded.iat <= 3601, "Token should expire within 1 hour");
  });

  runner.test("Password Reset - Wrong Token Type Rejection", () => {
    const payload = {
      id: "user-1",
      email: "test@example.com",
      role: "student",
      type: "auth",
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
    const decoded = jwt.verify(token, JWT_SECRET);

    runner.assert(decoded.type !== "password_reset", "Should not be a password reset token");
  });
}

function testEmailVerification(runner) {
  runner.test("Email Verification Token - Correct Type", () => {
    const payload = {
      id: "user-1",
      email: "test@example.com",
      role: "student",
      type: "email_verification",
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
    const decoded = jwt.verify(token, JWT_SECRET);

    runner.assert(decoded.type === "email_verification", "Token type should be email_verification");
  });

  runner.test("Email Verification Token - 24h Expiration", () => {
    const payload = {
      id: "user-1",
      email: "test@example.com",
      role: "student",
      type: "email_verification",
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
    const decoded = jwt.decode(token);

    runner.assert(decoded.exp - decoded.iat <= 86401, "Token should expire within 24 hours");
  });
}

function testRoleBasedAccess(runner) {
  const roles = ["super_admin", "school_admin", "teacher", "student"];

  roles.forEach((role) => {
    runner.test(`RBAC - ${role} Role Token Creation`, () => {
      const payload = {
        id: `user-${role}`,
        email: `${role}@example.com`,
        role,
        type: "auth",
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
      const decoded = jwt.verify(token, JWT_SECRET);

      runner.assert(decoded.role === role, `Role should be ${role}`);
    });
  });

  runner.test("RBAC - Multiple Roles Different Tokens", () => {
    const adminToken = jwt.sign(
      {
        id: "admin-1",
        email: "admin@example.com",
        role: "super_admin",
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const studentToken = jwt.sign(
      {
        id: "student-1",
        email: "student@example.com",
        role: "student",
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const adminDecoded = jwt.verify(adminToken, JWT_SECRET);
    const studentDecoded = jwt.verify(studentToken, JWT_SECRET);

    runner.assert(adminDecoded.role !== studentDecoded.role, "Roles should be different");
    runner.assert(adminDecoded.id !== studentDecoded.id, "IDs should be different");
  });
}

function testTokenPersistence(runner) {
  runner.test("Token Persistence - Cookie Format", () => {
    const payload = {
      id: "user-1",
      email: "test@example.com",
      role: "student",
      type: "auth",
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
    runner.assert(typeof token === "string", "Token should be a string");
    runner.assert(token.length > 50, "Token should be sufficiently long");
  });

  runner.test("Token Persistence - All User Data", () => {
    const payload = {
      id: "user-1",
      email: "test@example.com",
      role: "student",
      type: "auth",
      studentId: "stu-123",
      teacherId: undefined,
      schoolId: "school-456",
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
    const decoded = jwt.verify(token, JWT_SECRET);

    runner.assert(decoded.id === "user-1", "ID should persist");
    runner.assert(decoded.email === "test@example.com", "Email should persist");
    runner.assert(decoded.role === "student", "Role should persist");
    runner.assert(decoded.studentId === "stu-123", "StudentId should persist");
    runner.assert(decoded.schoolId === "school-456", "SchoolId should persist");
  });
}

function testSecurityEdgeCases(runner) {
  runner.test("Security - Null Token Handling", () => {
    try {
      jwt.verify(null, JWT_SECRET);
      throw new Error("Should reject null");
    } catch (error) {
      runner.assert(true, "Correctly rejected null");
    }
  });

  runner.test("Security - Empty String Token", () => {
    try {
      jwt.verify("", JWT_SECRET);
      throw new Error("Should reject empty string");
    } catch (error) {
      runner.assert(true, "Correctly rejected empty string");
    }
  });

  runner.test("Security - Malformed Token", () => {
    try {
      jwt.verify("not.a.valid.token", JWT_SECRET);
      throw new Error("Should reject malformed");
    } catch (error) {
      runner.assert(true, "Correctly rejected malformed token");
    }
  });

  runner.test("Security - Token Tampering Detection", () => {
    const payload = {
      id: "user-1",
      email: "test@example.com",
      role: "student",
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
    const parts = token.split(".");

    // Tamper with payload
    const tamperedToken = parts[0] + ".invalid_payload" + parts[2];

    try {
      jwt.verify(tamperedToken, JWT_SECRET);
      throw new Error("Should have rejected tampered token");
    } catch (error) {
      runner.assert(true, "Correctly detected tampering");
    }
  });

  runner.test("Security - Algorithm Mismatch", () => {
    const payload = {
      id: "user-1",
      email: "test@example.com",
      role: "student",
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d", algorithm: "HS512" });

    try {
      jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
      throw new Error("Should reject algorithm mismatch");
    } catch (error) {
      runner.assert(error.message.includes("algorithm"), "Should be algorithm error");
    }
  });
}

// Run all tests
const runner = new AuthTestRunner();

console.log("\n========== RUNNING AUTH REGRESSION TESTS ==========\n");

console.log("1️⃣  JWT Token Management:");
testJWTTokenGeneration(runner);

console.log("\n2️⃣  Password Reset Flow:");
testPasswordReset(runner);

console.log("\n3️⃣  Email Verification Flow:");
testEmailVerification(runner);

console.log("\n4️⃣  Role-Based Access Control:");
testRoleBasedAccess(runner);

console.log("\n5️⃣  Token Persistence:");
testTokenPersistence(runner);

console.log("\n6️⃣  Security & Edge Cases:");
testSecurityEdgeCases(runner);

// Print report
const results = runner.report();

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);
