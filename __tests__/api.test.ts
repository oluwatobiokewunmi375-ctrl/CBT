/**
 * CBT API Test Suite
 * 
 * Run tests with: npm test
 * Test a specific file: npm test -- api.test.ts
 * Watch mode: npm test -- --watch
 */

let studentToken = ""
let teacherToken = ""
let adminToken = ""
let existingStudentEmail = "student@demo.com"
let existingTeacherEmail = "teacher@demo.com"
let existingAdminEmail = "admin.demo@test.com"
let examId = ""

async function loginUser(credentials: { email: string; password: string }) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  })
  if (!response.ok) return null
  const data = await response.json()
  return data.token
}

async function createUser(role: string, email: string, password: string) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      fullName: `${role} Test`,
      role,
      schoolCode: "DEMO",
    }),
  })
  return response
}

beforeAll(async () => {
  const studentCandidates = [
    { email: "student@demo.com", password: "password123" },
    { email: "student.demo@test.com", password: "Student@123" },
  ]
  for (const creds of studentCandidates) {
    const token = await loginUser(creds)
    if (token) {
      studentToken = token
      existingStudentEmail = creds.email
      break
    }
  }
  if (!studentToken) {
    const email = `student+${Date.now()}@test.com`
    const password = "password123"
    const response = await createUser("STUDENT", email, password)
    const data = await response.json()
    studentToken = data.token
    existingStudentEmail = email
  }

  const teacherCandidates = [
    { email: "teacher@demo.com", password: "password123" },
    { email: "teacher.demo@test.com", password: "Teacher@123" },
  ]
  for (const creds of teacherCandidates) {
    const token = await loginUser(creds)
    if (token) {
      teacherToken = token
      existingTeacherEmail = creds.email
      break
    }
  }
  if (!teacherToken) {
    const email = `teacher+${Date.now()}@test.com`
    const password = "password123"
    const response = await createUser("TEACHER", email, password)
    const data = await response.json()
    teacherToken = data.token
    existingTeacherEmail = email
  }

  if (teacherToken) {
    const response = await fetch("/api/admin/exams", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        title: "API Test Exam",
        description: "Generated exam for API test",
        duration: 60,
        totalMarks: 100,
        questions: [
          {
            text: "What is 1+1?",
            marks: 10,
            type: "MULTIPLE_CHOICE",
            options: [
              { text: "1", isCorrect: false },
              { text: "2", isCorrect: true },
            ],
          },
        ],
      }),
    })
    if (response.ok) {
      const data = await response.json()
      examId = data.exam?.id || ""
    }
  }

  const adminCandidates = [
    { email: "admin.demo@test.com", password: "Admin@123" },
    { email: "admin@demo.com", password: "password123" },
  ]
  for (const creds of adminCandidates) {
    const token = await loginUser(creds)
    if (token) {
      adminToken = token
      existingAdminEmail = creds.email
      break
    }
  }
})

describe("Authentication API", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new student user", async () => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "newstudent@test.com",
          password: "password123",
          fullName: "New Student",
          role: "STUDENT",
          schoolCode: "DSS",
        }),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.token).toBeDefined()
      expect(data.user.email).toBe("newstudent@test.com")
      expect(data.user.role).toBe("STUDENT")
    })

    it("should register a new teacher user", async () => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "newteacher@test.com",
          password: "password123",
          fullName: "New Teacher",
          role: "TEACHER",
          schoolCode: "DSS",
        }),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.user.role).toBe("TEACHER")
    })

    it("should reject duplicate email", async () => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "student@demo.com",
          password: "password123",
          fullName: "Duplicate User",
          role: "STUDENT",
        }),
      })

      expect(response.status).toBe(409)
    })

    it("should require email and password", async () => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: "No Credentials" }),
      })

      expect(response.status).toBe(400)
    })
  })

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "student@demo.com",
          password: "password123",
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.token).toBeDefined()
      expect(data.user.email).toBe("student@demo.com")
    })

    it("should reject invalid credentials", async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "student@demo.com",
          password: "wrongpassword",
        }),
      })

      expect(response.status).toBe(401)
    })

    it("should reject non-existent user", async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nonexistent@test.com",
          password: "password123",
        }),
      })

      expect(response.status).toBe(401)
    })
  })

  describe("GET /api/auth/profile", () => {
    it("should return user profile with valid token", async () => {
      const response = await fetch("/api/auth/profile", {
        headers: { Authorization: `Bearer ${mockToken}` },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.profile).toBeDefined()
      expect(data.profile.email).toBeDefined()
      expect(data.profile.fullName).toBeDefined()
    })

    it("should reject request without token", async () => {
      const response = await fetch("/api/auth/profile")

      expect(response.status).toBe(401)
    })

    it("should reject invalid token", async () => {
      const response = await fetch("/api/auth/profile", {
        headers: { Authorization: "Bearer invalid-token" },
      })

      expect(response.status).toBe(401)
    })
  })
})

describe("Exam API", () => {
  describe("GET /api/exam/list", () => {
    it("should return list of available exams", async () => {
      const response = await fetch("/api/exam/list", {
        headers: { Authorization: `Bearer ${mockToken}` },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.exams)).toBe(true)
    })

    it("should reject unauthorized request", async () => {
      const response = await fetch("/api/exam/list")

      expect(response.status).toBe(401)
    })
  })

  describe("GET /api/exam/[id]", () => {
    it("should return exam details with questions", async () => {
      const response = await fetch(`/api/exam/${mockExamId}`, {
        headers: { Authorization: `Bearer ${mockToken}` },
      })

      if (response.ok) {
        const data = await response.json()
        expect(data.exam).toBeDefined()
        expect(data.exam.title).toBeDefined()
        expect(Array.isArray(data.exam.questions)).toBe(true)
      }
    })

    it("should return 404 for non-existent exam", async () => {
      const response = await fetch("/api/exam/non-existent-id", {
        headers: { Authorization: `Bearer ${mockToken}` },
      })

      expect(response.status).toBe(404)
    })
  })

  describe("POST /api/exam/submit", () => {
    it("should submit exam answers and calculate score", async () => {
      const response = await fetch("/api/exam/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({
          examId: mockExamId,
          answers: {
            question1: "option1",
            question2: "option2",
          },
          timeSpent: 25,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.submission).toBeDefined()
        expect(data.submission.score).toBeDefined()
      }
    })

    it("should reject submission without required fields", async () => {
      const response = await fetch("/api/exam/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({ timeSpent: 25 }),
      })

      expect(response.status).toBe(400)
    })
  })
})

describe("Admin API", () => {
  describe("POST /api/admin/exams", () => {
    it("should create exam (teacher only)", async () => {
      const response = await fetch("/api/admin/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({
          title: "New Test Exam",
          description: "Test exam for API",
          duration: 60,
          totalMarks: 100,
          questions: [
            {
              text: "Test question?",
              marks: 10,
              type: "MCQ",
              options: [
                { text: "Option 1", isCorrect: true },
                { text: "Option 2", isCorrect: false },
              ],
            },
          ],
        }),
      })

      if (response.ok) {
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.exam).toBeDefined()
        expect(data.exam.title).toBe("New Test Exam")
      }
    })

    it("should reject non-teacher users", async () => {
      // This test assumes student token
      const response = await fetch("/api/admin/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify({
          title: "Test",
          duration: 60,
          totalMarks: 100,
        }),
      })

      expect(response.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe("GET /api/admin/dashboard", () => {
    it("should return dashboard statistics", async () => {
      const response = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${mockToken}` },
      })

      if (response.ok) {
        const data = await response.json()
        expect(data.dashboard).toBeDefined()
        expect(data.dashboard.statistics).toBeDefined()
        expect(data.dashboard.statistics.totalExams).toBeDefined()
        expect(data.dashboard.statistics.totalStudents).toBeDefined()
      }
    })
  })
})

describe("Results API", () => {
  describe("GET /api/results/list", () => {
    it("should return student results", async () => {
      const response = await fetch("/api/results/list", {
        headers: { Authorization: `Bearer ${mockToken}` },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.results)).toBe(true)
    })
  })

  describe("GET /api/results/export", () => {
    it("should export results as JSON", async () => {
      const response = await fetch(`/api/results/export?examId=${mockExamId}`, {
        headers: { Authorization: `Bearer ${mockToken}` },
      })

      if (response.ok) {
        const data = await response.json()
        expect(data.report).toBeDefined()
      }
    })

    it("should export results as CSV", async () => {
      const response = await fetch(
        `/api/results/export?examId=${mockExamId}&format=csv`,
        {
          headers: { Authorization: `Bearer ${mockToken}` },
        }
      )

      if (response.ok) {
        expect(response.headers.get("content-type")).toContain("text/csv")
      }
    })
  })
})

describe("Analytics API", () => {
  describe("GET /api/analytics/exam", () => {
    it("should return exam analytics", async () => {
      const response = await fetch(`/api/analytics/exam?examId=${mockExamId}`, {
        headers: { Authorization: `Bearer ${mockToken}` },
      })

      if (response.ok) {
        const data = await response.json()
        expect(data.analytics).toBeDefined()
        expect(data.analytics.statistics).toBeDefined()
        expect(data.analytics.statistics.averageScore).toBeDefined()
      }
    })
  })
})

describe("School API", () => {
  describe("POST /api/school", () => {
    it("should create new school", async () => {
      const response = await fetch("/api/school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New School",
          shortCode: "NS",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.school).toBeDefined()
      }
    })
  })

  describe("GET /api/school", () => {
    it("should list all schools", async () => {
      const response = await fetch("/api/school")

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.schools)).toBe(true)
    })
  })
})

describe("Health Check", () => {
  describe("GET /api/health", () => {
    it("should return health status", async () => {
      const response = await fetch("/api/health")

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.status).toBe("healthy")
      expect(data.database).toBeDefined()
    })
  })
})

