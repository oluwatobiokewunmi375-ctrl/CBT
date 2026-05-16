# Seed and Verify (local + CI)

This document explains how to seed the provided mock accounts and run a quick verification of login endpoints locally and in CI.

Prerequisites
- Node.js installed
- A running Postgres instance reachable by `DATABASE_URL` in `.env` or `.env.local`
- `npx prisma generate` has been run (the repo includes `@prisma/client`)

Local steps

1. Ensure environment variables are set (see `.env` / `.env.local`). Important values:
   - `DATABASE_URL` (e.g. `postgresql://postgres:postgres@localhost:5433/cbt`)
   - `JWT_SECRET` (used by auth)

2. Apply Prisma schema:

```bash
npx prisma db push
npx prisma generate
```

3. Seed the provided mock accounts:

```bash
npm run seed:mock
```

This creates:
- Super Admin: `Adebayosamuel015@gmail.com` / `Hibilero@2104`
- School: `laterna` (shortCode `lvl`)
- School Admin: `samuela@laternabooks.ng` / `Laterna@1234`
- Student: `Paul John` — email `adebayosulaimansamuel@gmail.com`, studentNo `STU-lvl-0001`

4. Start the app (dev server):

```bash
npm run dev
```

5. Verify seeded accounts against the running API (defaults to `http://localhost:3000`):

```bash
npm run verify:seed
# or specify a different base URL
# BASE_URL=http://127.0.0.1:3000 npm run verify:seed
```

CI example (GitHub Actions)

Below is a minimal GitHub Actions job that starts Postgres, applies the Prisma schema, runs the seed script, starts the app briefly (or runs verification against API routes via `next start`), and runs the verification script.

Create `.github/workflows/seed-verify.yml` with:

```yaml
name: Seed and Verify

on: [push]

jobs:
  seed-verify:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: cbt
        ports:
          - 5433:5432
        options: >-
          --health-cmd "pg_isready -U postgres -d cbt"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install deps
        run: npm ci
      - name: Set env
        run: |
          echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5433/cbt" >> $GITHUB_ENV
          echo "JWT_SECRET=test-jwt-secret" >> $GITHUB_ENV
      - name: Apply Prisma
        run: npx prisma db push
      - name: Seed
        run: npm run seed:mock
      - name: Start app (background)
        run: npm run start &
      - name: Verify
        run: npm run verify:seed
```

Notes
- CI will need `npm run start` to serve the Next.js app (build may be required in some setups). Adjust the job to `npm run build` then `npm run start` if necessary.
- The seed script writes real user records into the configured DB — do not run against production databases.

If you'd like I can:
- add the GitHub Actions workflow file directly, or
- implement a Playwright/Jest end-to-end test that runs the seed+verify sequence in CI.