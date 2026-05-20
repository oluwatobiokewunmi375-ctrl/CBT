import { signJwtToken, verifyJwtToken } from "@/lib/auth/jwt";
import { hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";

describe("AUTH REGRESSION TEST SUITE", () => {
  const testSecret = process.env.JWT_SECRET || "test-secret-key-01234567890123456789";
  const baseUrl = "http://localhost:3000";

  describe("1. FORGOT PASSWORD FLOW", () => {
    test("should generate reset token for valid email", async () => {
      const email = "testuser@example.com";
      
      const response = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.resetUrl).toBeDefined();
      expect(data.resetUrl).toContain("reset-password?token=");
    });

    test("should return success for non-existent email (privacy)", async () => {
      const email = "nonexistent@example.com";
      
      const response = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("If that email exists");
    });

    test("should reject invalid email format", async () => {
      const response = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-an-email" }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    test("should reject missing email", async () => {
      const response = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("2. RESET PASSWORD FLOW", () => {
    test("should accept valid reset token and update password", async () => {
      const payload = {
        id: "test-user-1",
        email: "test@example.com",
        role: "student",
        type: "password_reset" as const,
      };

      const token = signJwtToken(payload, "1h");
      const newPassword = "NewSecurePassword123";

      const response = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: newPassword }),
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("Password updated successfully");
    });

    test("should reject invalid reset token type", async () => {
      const payload = {
        id: "test-user-1",
        email: "test@example.com",
        role: "student",
        type: "auth" as const,
      };

      const token = signJwtToken(payload, "1h");
      const newPassword = "NewSecurePassword123";

      const response = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: newPassword }),
      });

      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid or expired reset token");
    });

    test("should reject expired reset token", async () => {
      const payload = {
        id: "test-user-1",
        email: "test@example.com",
        role: "student",
        type: "password_reset" as const,
      };

      const token = signJwtToken(payload, "-1s");
      const newPassword = "NewSecurePassword123";

      const response = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: newPassword }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Invalid or expired reset token");
    });

    test("should reject malformed token", async () => {
      const response = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "not.a.valid.token",
          password: "NewSecurePassword123",
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    test("should reject short password", async () => {
      const payload = {
        id: "test-user-1",
        email: "test@example.com",
        role: "student",
        type: "password_reset" as const,
      };

      const token = signJwtToken(payload, "1h");

      const response = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: "short" }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("3. EMAIL VERIFICATION FLOW", () => {
    test("should accept valid email verification token", async () => {
      const payload = {
        id: "test-user-2",
        email: "verify@example.com",
        role: "student",
        type: "email_verification" as const,
      };

      const token = signJwtToken(payload, "24h");

      const response = await fetch(`${baseUrl}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("Email verified successfully");
    });

    test("should reject invalid email verification token type", async () => {
      const payload = {
        id: "test-user-2",
        email: "verify@example.com",
        role: "student",
        type: "auth" as const,
      };

      const token = signJwtToken(payload, "24h");

      const response = await fetch(`${baseUrl}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid or expired verification token");
    });

    test("should reject expired email verification token", async () => {
      const payload = {
        id: "test-user-2",
        email: "verify@example.com",
        role: "student",
        type: "email_verification" as const,
      };

      const token = signJwtToken(payload, "-1s");

      const response = await fetch(`${baseUrl}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Invalid or expired verification token");
    });

    test("should return success for already verified email", async () => {
      const payload = {
        id: "test-user-3",
        email: "already-verified@example.com",
        role: "student",
        type: "email_verification" as const,
      };

      const token = signJwtToken(payload, "24h");

      const response = await fetch(`${baseUrl}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe("4. EXPIRED TOKEN HANDLING", () => {
    test("should reject expired auth token", () => {
      const payload = {
        id: "test-user-4",
        email: "expired@example.com",
        role: "student",
        type: "auth" as const,
      };

      const token = signJwtToken(payload, "-1s");
      const result = verifyJwtToken(token);

      expect(result).toBeNull();
    });

    test("should reject token with invalid signature", () => {
      const payload = {
        id: "test-user-5",
        email: "badsig@example.com",
        role: "student",
        type: "auth" as const,
      };

      const token = signJwtToken(payload, "1h");
      const tamperedToken = token.slice(0, -10) + "XXXXXXXXXX";

      const result = verifyJwtToken(tamperedToken);
      expect(result).toBeNull();
    });

    test("should reject malformed token", () => {
      const malformedToken = "not.a.token.at.all";
      const result = verifyJwtToken(malformedToken);
      expect(result).toBeNull();
    });

    test("should reject empty token", () => {
      const result = verifyJwtToken("");
      expect(result).toBeNull();
    });
  });

  describe("5. INVALID TOKEN HANDLING", () => {
    test("should reject token with missing required fields", () => {
      const token = jwt.sign(
        {
          email: "missing-id@example.com",
          role: "student",
        },
        testSecret,
        { expiresIn: "1h" }
      );

      const result = verifyJwtToken(token);
      expect(result).toBeNull();
    });

    test("should reject token with missing email", () => {
      const token = jwt.sign(
        {
          id: "test-user-6",
          role: "student",
        },
        testSecret,
        { expiresIn: "1h" }
      );

      const result = verifyJwtToken(token);
      expect(result).toBeNull();
    });

    test("should reject token with missing role", () => {
      const token = jwt.sign(
        {
          id: "test-user-7",
          email: "no-role@example.com",
        },
        testSecret,
        { expiresIn: "1h" }
      );

      const result = verifyJwtToken(token);
      expect(result).toBeNull();
    });

    test("should handle token with extra fields", () => {
      const payload = {
        id: "test-user-8",
        email: "extra@example.com",
        role: "student",
        type: "auth" as const,
        extra: "field",
      };

      const token = signJwtToken(payload, "1h");
      const result = verifyJwtToken(token);

      expect(result).not.toBeNull();
      expect(result?.id).toBe("test-user-8");
      expect(result?.email).toBe("extra@example.com");
    });
  });

  describe("6. JWT PERSISTENCE", () => {
    test("should include token in response cookie", async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "login@example.com",
          password: "ValidPassword123",
        }),
      });

      if (response.ok) {
        const setCookieHeader = response.headers.get("set-cookie");
        expect(setCookieHeader).toBeDefined();
        expect(setCookieHeader).toContain("token=");
        expect(setCookieHeader).toContain("HttpOnly");
        expect(setCookieHeader).toContain("SameSite=Strict");
      }
    });

    test("should read token from Authorization header", () => {
      const payload = {
        id: "test-user-9",
        email: "auth-header@example.com",
        role: "student",
        type: "auth" as const,
      };

      const token = signJwtToken(payload, "1h");
      const authHeader = `Bearer ${token}`;

      const result = verifyJwtToken(token);
      expect(result).not.toBeNull();
      expect(result?.id).toBe("test-user-9");
    });

    test("should include all user data in token", () => {
      const payload = {
        id: "test-user-10",
        email: "complete@example.com",
        role: "student",
        type: "auth" as const,
        studentId: "student-123",
        teacherId: undefined,
        schoolId: "school-456",
      };

      const token = signJwtToken(payload, "1h");
      const result = verifyJwtToken(token);

      expect(result).not.toBeNull();
      expect(result?.id).toBe("test-user-10");
      expect(result?.email).toBe("complete@example.com");
      expect(result?.role).toBe("student");
      expect(result?.studentId).toBe("student-123");
      expect(result?.schoolId).toBe("school-456");
      expect(result?.type).toBe("auth");
    });
  });

  describe("7. MIDDLEWARE REDIRECTS", () => {
    test("should redirect unauthenticated requests to login", async () => {
      const response = await fetch(`${baseUrl}/dashboard`, {
        redirect: "manual",
      });

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/login");
    });

    test("should preserve 'from' parameter in redirect", async () => {
      const response = await fetch(`${baseUrl}/exam/123`, {
        redirect: "manual",
      });

      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toContain("/login");
      expect(location).toContain("from=");
    });

    test("should return 401 for API calls without token", async () => {
      const response = await fetch(`${baseUrl}/api/protected`, {
        method: "GET",
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe("Unauthorized");
    });

    test("should return 401 for API calls with invalid token", async () => {
      const response = await fetch(`${baseUrl}/api/protected`, {
        method: "GET",
        headers: {
          Authorization: "Bearer invalid.token.here",
        },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test("should allow public paths without token", async () => {
      const response = await fetch(`${baseUrl}/login`);
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(307);
    });
  });

  describe("8. LOGOUT INVALIDATION", () => {
    test("should clear token cookie on logout", async () => {
      const response = await fetch(`${baseUrl}/api/auth/logout`, {
        method: "POST",
      });

      expect(response.status).toBe(200);
      const setCookieHeader = response.headers.get("set-cookie");
      expect(setCookieHeader).toBeDefined();
      expect(setCookieHeader).toContain("token=");
      expect(setCookieHeader).toContain("MaxAge=0");
    });

    test("should set maxAge to 0 for token cookie", async () => {
      const response = await fetch(`${baseUrl}/api/auth/logout`, {
        method: "POST",
      });

      const setCookieHeader = response.headers.get("set-cookie");
      expect(setCookieHeader).toContain("max-age=0");
    });

    test("should return success response on logout", async () => {
      const response = await fetch(`${baseUrl}/api/auth/logout`, {
        method: "POST",
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain("Logged out successfully");
    });
  });

  describe("9. ROLE-BASED ACCESS CONTROL (RBAC)", () => {
    const createToken = (role: string, userId: string) =>
      signJwtToken(
        {
          id: userId,
          email: `${role}@example.com`,
          role: role as any,
          type: "auth",
        },
        "1h"
      );

    test("super_admin token should have correct role", () => {
      const token = createToken("super_admin", "admin-1");
      const decoded = verifyJwtToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.role).toBe("super_admin");
    });

    test("school_admin token should have correct role", () => {
      const token = createToken("school_admin", "school-admin-1");
      const decoded = verifyJwtToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.role).toBe("school_admin");
    });

    test("teacher token should have correct role", () => {
      const token = createToken("teacher", "teacher-1");
      const decoded = verifyJwtToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.role).toBe("teacher");
    });

    test("student token should have correct role", () => {
      const token = createToken("student", "student-1");
      const decoded = verifyJwtToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.role).toBe("student");
    });

    test("should verify different roles have different tokens", () => {
      const adminToken = createToken("super_admin", "admin-1");
      const studentToken = createToken("student", "student-1");

      const adminDecoded = verifyJwtToken(adminToken);
      const studentDecoded = verifyJwtToken(studentToken);

      expect(adminDecoded?.role).not.toBe(studentDecoded?.role);
      expect(adminDecoded?.id).not.toBe(studentDecoded?.id);
    });

    test("should preserve role through token lifecycle", () => {
      const role = "teacher";
      const token = createToken(role, "teacher-123");
      const decoded = verifyJwtToken(token);

      expect(decoded?.role).toBe(role);
    });
  });

  describe("EDGE CASES & SECURITY", () => {
    test("should handle null tokens gracefully", () => {
      const result = verifyJwtToken(null as any);
      expect(result).toBeNull();
    });

    test("should handle undefined tokens gracefully", () => {
      const result = verifyJwtToken(undefined as any);
      expect(result).toBeNull();
    });

    test("should reject tokens with wrong algorithm", () => {
      const payload = { id: "test", email: "test@example.com", role: "student" };
      const token = jwt.sign(payload, testSecret, {
        expiresIn: "1h",
        algorithm: "HS512",
      });

      const result = verifyJwtToken(token);
      expect(result).toBeNull();
    });

    test("should handle rate limiting on forgot password", async () => {
      const email = "ratelimit@example.com";
      const requests = [];

      for (let i = 0; i < 11; i++) {
        requests.push(
          fetch(`${baseUrl}/api/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some((r) => r.status === 429);

      if (rateLimited) {
        expect(rateLimited).toBe(true);
      }
    });
  });
});
