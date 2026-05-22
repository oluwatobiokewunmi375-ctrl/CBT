CBT Repo — Seeded Accounts & Login Details

- UI login page: /login
- API login endpoint: /api/auth/login
- Seed endpoint: POST /api/seed (requires key: CBT_SEED_2024)
- Admin reset password endpoint: /api/admin/reset-student-password (admin only)
- Default student password (used by tests/seeds): stud123

Seeded / Mock accounts found in the repo:

- Super Admin (seedExam & scripts): adebayosamuel015@gmail.com / Hibilero@2104
- Super Admin (legacy seed script): admin@cbt.com / admin123 (from prisma/seed.cjs)
- Alternate superadmin referenced in tests/logs: superadmin@test.com / admin123
- School Admin: admin@test.com / admin123
- Teacher: teacher@test.com / teacher123
- Students (created by lib/seedExam.ts):
  - STU001 -> email: stu001@test.local (created as STU001@test.local in seeds) — password: stud123
  - STU002 -> password: stud123
  - STU003 -> password: stud123
  - STU004 -> password: stud123
  - STU005 -> password: stud123
- Resilience Student: resilience-student@test.com / student123 (studentNo: STURESIL001)

Notes & verification hints:
- Some seeders normalize emails case-insensitively; look for `mode: 'insensitive'` and `toLowerCase()` in seed scripts.
- Student login flow uses `studentNo` + optional password; server defaults missing student password to `stud123`.
- The main UI login page sanitizes API error payloads before calling `toast.error` to avoid runtime crashes.

Useful commands:

- npx prisma generate
- npx prisma db push
- npm run seed:mock   # runs scripts/create-mock-accounts.* or local seeder
- POST /api/seed with JSON { key: "CBT_SEED_2024" } to trigger lib/seedExam.ts
- npx playwright test --workers=1

If you want, I can run the Prisma / seed / Playwright commands now (requires permission).