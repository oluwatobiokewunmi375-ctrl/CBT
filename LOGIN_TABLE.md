| Role | Email / StudentNo | Password | Location / Notes |
|---|---|---|---|
| Super Admin | adebayosamuel015@gmail.com | Hibilero@2104 | lib/seedExam.ts, scripts/create-mock-accounts.cjs |
| Super Admin (legacy) | admin@cbt.com | admin123 | prisma/seed.cjs |
| Super Admin (tests) | superadmin@test.com | admin123 | referenced in tests and seed logs |
| School Admin | admin@test.com | admin123 | lib/seedExam.ts / app/api/seed/route.ts logs |
| Teacher | teacher@test.com | teacher123 | lib/seedExam.ts |
| Student STU001 | STU001 (email: stu001@test.local) | stud123 | lib/seedExam.ts (STU001..STU005) |
| Student STU002 | STU002 (email: stu002@test.local) | stud123 | lib/seedExam.ts |
| Student STU003 | STU003 (email: stu003@test.local) | stud123 | lib/seedExam.ts |
| Student STU004 | STU004 (email: stu004@test.local) | stud123 | lib/seedExam.ts |
| Student STU005 | STU005 (email: stu005@test.local) | stud123 | lib/seedExam.ts |
| Resilience Student | STURESIL001 (resilience-student@test.com) | student123 | lib/seedExam.ts (resilience fixtures) |

Endpoints:
- UI: /login
- API: /api/auth/login
- Seed (POST): /api/seed (key: CBT_SEED_2024)
- Reset student password: /api/admin/reset-student-password

Default student password for tests: stud123
