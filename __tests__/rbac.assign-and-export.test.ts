import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { URL } from "url";

import { POST as loginPost } from "@/app/api/auth/login/route";
import { POST as registerPost } from "@/app/api/auth/register/route";
import { POST as schoolPost } from "@/app/api/school/route";
import { POST as classRoomPost } from "@/app/api/admin/classrooms/route";
import { POST as studentPost } from "@/app/api/admin/students/route";
import { POST as examPost } from "@/app/api/admin/exams/route";
import { POST as assignStudentPost } from "@/app/api/admin/assign-student/route";
import { GET as studentsGet } from "@/app/api/admin/students/route";
import { GET as resultsExportGet } from "@/app/api/results/export/route";

const randomSuffix = Math.random().toString(36).slice(2, 8);
const schoolCodeA = `TSA${randomSuffix}`;
const schoolCodeB = `TSB${randomSuffix}`;
const teacherAEmail = `teacher-a+${randomSuffix}@example.com`;
const studentAEmail = `student-a+${randomSuffix}@example.com`;
const schoolAdminAEmail = `school-admin-a+${randomSuffix}@example.com`;
const schoolAdminBEmail = `school-admin-b+${randomSuffix}@example.com`;
const password = "TestPass123!";

let superAdminToken = "";
let schoolAdminAToken = "";
let schoolAdminBToken = "";
let teacherAToken = "";
let studentAToken = "";
let classRoomAId = "";
let classRoomBId = "";
let teacherExamId = "";
let schoolAdminExamId = "";

async function callRoute(request: Request, handler: (req: NextRequest) => Promise<Response | NextResponse>) {
  const response = await handler(request as NextRequest);
  const bodyText = await response.text();
  let body: any = null;
  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    body = bodyText;
  }
  return {
    status: response.status,
    body,
  };
}

function buildRequest(path: string, method: string, body?: unknown, token?: string) {
  const url = new URL(`http://localhost${path}`);
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return new Request(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }) as NextRequest;
}

async function loginUser(email: string, password: string): Promise<string | null> {
  const result = await callRoute(buildRequest("/api/auth/login", "POST", { email, password }), loginPost);
  return result.status === 200 && result.body?.token ? result.body.token : null;
}

async function loginAnySuperAdmin(): Promise<string> {
  const candidates = [
    { email: "superadmin@test.com", password: "admin123" },
    { email: "admin@cbt.com", password: "admin123" },
    { email: "adebayosamuel015@gmail.com", password: "Hibilero@2104" },
  ];
  for (const creds of candidates) {
    const token = await loginUser(creds.email, creds.password);
    if (token) return token;
  }
  throw new Error("No seeded super admin credentials were valid in this environment.");
}

async function createUser(payload: Record<string, any>, token?: string) {
  return callRoute(buildRequest("/api/auth/register", "POST", payload, token), registerPost);
}

async function createSchool(payload: Record<string, any>, token?: string) {
  return callRoute(buildRequest("/api/school", "POST", payload, token), schoolPost);
}

async function createClassRoom(payload: Record<string, any>, token?: string) {
  return callRoute(buildRequest("/api/admin/classrooms", "POST", payload, token), classRoomPost);
}

async function createStudent(payload: Record<string, any>, token?: string) {
  return callRoute(buildRequest("/api/admin/students", "POST", payload, token), studentPost);
}

async function createExam(payload: Record<string, any>, token?: string) {
  return callRoute(buildRequest("/api/admin/exams", "POST", payload, token), examPost);
}

async function assignStudent(payload: Record<string, any>, token?: string) {
  return callRoute(buildRequest("/api/admin/assign-student", "POST", payload, token), assignStudentPost);
}

async function fetchStudents(token?: string) {
  return callRoute(buildRequest("/api/admin/students", "GET", undefined, token), studentsGet);
}

async function exportResults(examId: string, token?: string) {
  return callRoute(buildRequest(`/api/results/export?examId=${examId}`, "GET", undefined, token), resultsExportGet);
}

describe("RBAC enforcement for student assignment and result export", () => {
  beforeAll(async () => {
    superAdminToken = await loginAnySuperAdmin();

    const createSchoolA = await createSchool({ name: `Test School A ${randomSuffix}`, shortCode: schoolCodeA }, superAdminToken);
    expect(createSchoolA.status).toBe(201);

    const createSchoolB = await createSchool({ name: `Test School B ${randomSuffix}`, shortCode: schoolCodeB }, superAdminToken);
    expect(createSchoolB.status).toBe(201);

    const createSchoolAdminA = await createUser({
      email: schoolAdminAEmail,
      password,
      fullName: "School Admin A",
      role: Role.SCHOOL_ADMIN,
      schoolCode: schoolCodeA,
    }, superAdminToken);
    expect(createSchoolAdminA.status).toBe(201);
    schoolAdminAToken = createSchoolAdminA.body.token;

    const createSchoolAdminB = await createUser({
      email: schoolAdminBEmail,
      password,
      fullName: "School Admin B",
      role: Role.SCHOOL_ADMIN,
      schoolCode: schoolCodeB,
    }, superAdminToken);
    expect(createSchoolAdminB.status).toBe(201);
    schoolAdminBToken = createSchoolAdminB.body.token;

    const registerTeacherA = await createUser({
      email: teacherAEmail,
      password,
      fullName: "Teacher A",
      role: Role.TEACHER,
      schoolCode: schoolCodeA,
    });
    expect(registerTeacherA.status).toBe(201);
    teacherAToken = registerTeacherA.body.token;

    const createClassA = await createClassRoom({ name: "Form 1A" }, schoolAdminAToken);
    expect(createClassA.status).toBe(201);
    classRoomAId = createClassA.body.classRoom.id;

    const createClassB = await createClassRoom({ name: "Form 1B" }, schoolAdminAToken);
    expect(createClassB.status).toBe(201);
    classRoomBId = createClassB.body.classRoom.id;

    const createStudentA = await createStudent({
      email: studentAEmail,
      password,
      fullName: "Student A",
      classRoomId: classRoomAId,
    }, schoolAdminAToken);
    expect(createStudentA.status).toBe(201);

    const loginStudentA = await loginUser(studentAEmail, password);
    expect(loginStudentA).toBeTruthy();
    studentAToken = loginStudentA as string;

    const teacherExam = await createExam({ title: "Teacher A Exam", duration: 10, totalMarks: 50 }, teacherAToken);
    expect(teacherExam.status).toBe(201);
    teacherExamId = teacherExam.body.exam.id;

    const schoolAdminExam = await createExam({ title: "School Admin A Exam", duration: 10, totalMarks: 100 }, schoolAdminAToken);
    expect(schoolAdminExam.status).toBe(201);
    schoolAdminExamId = schoolAdminExam.body.exam.id;
  }, 120000);

  test("assign-student is forbidden for teacher and student but allowed for school admin and super admin", async () => {
    const students = await fetchStudents(schoolAdminAToken);
    expect(students.status).toBe(200);
    const studentId = students.body.students[0].id;

    const assignByTeacher = await assignStudent({ studentId, classRoomId: classRoomBId }, teacherAToken);
    expect(assignByTeacher.status).toBe(403);

    const assignByStudent = await assignStudent({ studentId, classRoomId: classRoomBId }, studentAToken);
    expect(assignByStudent.status).toBe(403);

    const assignBySchoolAdmin = await assignStudent({ studentId, classRoomId: classRoomBId }, schoolAdminAToken);
    expect(assignBySchoolAdmin.status).toBe(200);

    const assignByOtherSchoolAdmin = await assignStudent({ studentId, classRoomId: classRoomBId }, schoolAdminBToken);
    expect(assignByOtherSchoolAdmin.status).toBe(403);

    const assignBySuperAdmin = await assignStudent({ studentId, classRoomId: classRoomAId }, superAdminToken);
    expect(assignBySuperAdmin.status).toBe(200);
  });

  test("results export enforces teacher ownership and school scoping", async () => {
    const teacherOwnExport = await exportResults(teacherExamId, teacherAToken);
    expect(teacherOwnExport.status).toBe(200);
    expect(teacherOwnExport.body).toHaveProperty("success", true);

    const teacherOtherExport = await exportResults(schoolAdminExamId, teacherAToken);
    expect(teacherOtherExport.status).toBe(403);

    const schoolAdminSameExport = await exportResults(teacherExamId, schoolAdminAToken);
    expect(schoolAdminSameExport.status).toBe(200);
    expect(schoolAdminSameExport.body).toHaveProperty("success", true);

    const schoolAdminDifferentExport = await exportResults(teacherExamId, schoolAdminBToken);
    expect(schoolAdminDifferentExport.status).toBe(403);

    const studentExport = await exportResults(teacherExamId, studentAToken);
    expect(studentExport.status).toBe(403);
  });
});
