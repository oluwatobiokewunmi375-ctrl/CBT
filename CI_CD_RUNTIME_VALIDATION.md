# CI/CD Runtime Stability Validation

**Status**: ENABLED - All runtime validations are gated

## Mandatory Validation Gates

Before every merge to `main` or `develop`, ALL of the following must pass:

### 1. Build & Compilation
```bash
npm run build
```
- **Purpose**: Ensure TypeScript compilation succeeds
- **Status**: PASS/FAIL gates merge
- **Regression**: Any TypeScript errors block merge

### 2. Type Checking
```bash
npm run typecheck
```
- **Purpose**: Validate type safety across codebase
- **Status**: PASS/FAIL gates merge
- **Regression**: New type errors block merge

### 3. Linting
```bash
npm run lint
```
- **Purpose**: Enforce code style and prevent antipatterns
- **Status**: PASS/FAIL gates merge
- **Regression**: Linting failures block merge

### 4. Runtime Lock Validation Tests
```bash
npx jest __tests__/runtime-lock-validation.test.ts --verbose
```
- **Purpose**: Validate core runtime invariants
- **Coverage**:
  - Session uniqueness
  - Duplicate submission prevention
  - Ownership enforcement
  - Expiry enforcement
  - Answer preservation
  - Version atomicity
- **Status**: PASS/FAIL gates merge
- **Regression**: Failed invariant = regression; blocks merge

### 5. Resilience E2E Tests
```bash
npx playwright test tests-e2e/exam-resilience.spec.ts --config=playwright.config.ts --workers=1
```
- **Purpose**: Validate real-world resilience scenarios
- **Coverage**:
  - Multi-tab ownership enforcement
  - Stale save rejection
  - Session expiry validation
  - Duplicate submission prevention
  - Session restore on refresh
  - Offline recovery behavior
- **Status**: PASS/FAIL gates merge
- **Regression**: Failed E2E test = regression; blocks merge

### 6. Load Test Baseline (25 Users)
```bash
DISABLE_RATE_LIMIT=true node scripts/load-stress.cjs --students=25 --no-setup
```
- **Purpose**: Validate runtime stability under concurrent load
- **Expected Metrics**:
  - Login: 25 success, 0 failures
  - Start: 25 success, 0 failures
  - Submit: 25 success, 0 failures
  - Database: 0 duplicate rows
- **409 Conflicts**: Expected ~20-30% on autosave; indicates healthy concurrency
- **Status**: PASS/FAIL gates merge
- **Regression Indicators**:
  - Database duplicates found
  - Unexpected API errors
  - Submit success < 80%
  - Build or test failures

## Validation Script

Create `.github/workflows/runtime-stability-check.yml`:

```yaml
name: Runtime Stability Check

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  runtime-validation:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: cbt_test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        
      - name: Type checking
        run: npm run typecheck
        
      - name: Linting
        run: npm run lint
      
      - name: Setup test database
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/cbt_test
        run: |
          npx prisma migrate deploy
          npx prisma db seed
      
      - name: Runtime Lock Validation Tests
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/cbt_test
        run: npx jest __tests__/runtime-lock-validation.test.ts --verbose
      
      - name: Playwright Resilience Tests
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/cbt_test
          PLAYWRIGHT_BASE_URL: http://127.0.0.1:3000
        run: |
          npx next build
          npm run start &
          sleep 5
          npx playwright test tests-e2e/exam-resilience.spec.ts --config=playwright.config.ts --workers=1
      
      - name: Load Test (25 users)
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/cbt_test
          DISABLE_RATE_LIMIT: true
        run: node scripts/load-stress.cjs --students=25 --no-setup
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: |
            test-results/
            playwright-report/
            jest-summary.json
```

## Manual Pre-Merge Checklist

Before pushing to main/develop, developer must verify locally:

- [ ] `npm run build` succeeds (TypeScript compilation)
- [ ] `npm run typecheck` passes (type safety)
- [ ] `npm run lint` passes (code style)
- [ ] `npx jest __tests__/runtime-lock-validation.test.ts` passes
- [ ] `npx playwright test tests-e2e/exam-resilience.spec.ts` passes
- [ ] `DISABLE_RATE_LIMIT=true node scripts/load-stress.cjs --students=25` passes
- [ ] `npm run build` succeeds (production build)
- [ ] No new TypeScript errors introduced
- [ ] RUNTIME_STABILITY_LOCK.md not modified (locked document)

## Regression Failure Response

If ANY validation gate fails:

1. **Runtime Lock Validation Test Failed**
   - Review RUNTIME_STABILITY_LOCK.md
   - Identify which invariant was violated
   - DO NOT weaken invariant; fix the code
   - Escalate to architecture review

2. **E2E Test Failed**
   - Reproduce locally with playwright inspector
   - Check browser logs for errors
   - Review any API changes that might affect resilience
   - Fix the issue before merging

3. **Load Test Failed**
   - Check database for duplicate rows
   - Verify API endpoints return expected status codes
   - Review autosave conflict rates
   - If 409 rates spike > 50%, investigate version conflict logic

4. **Build/Type/Lint Failed**
   - Fix compilation errors first
   - Run all validators before retry

## Protected Runtime Sections (Do Not Modify Without Failing Tests)

The following sections are protected by tests:

- `app/api/exam/start/route.ts` - Session creation
- `app/api/exam/save-progress/route.ts` - Autosave concurrency
- `app/api/exam/submit/route.ts` - Submission pipeline
- `prisma/schema.prisma` - Session/Result/ExamSubmission models

Any modification to these must:
1. Pass all validation gates
2. Update tests if semantics changed
3. Include justification in commit message
4. Be reviewed for runtime impact

## Expected Pass Rate

- **Build**: 100% (compilation only)
- **TypeCheck**: 100% (type safety)
- **Lint**: 100% (code style)
- **Runtime Validation Tests**: 100%
- **Resilience E2E**: 100%
- **Load Test**: 100% (0 duplicate rows; submit success ≥ 80%)

## Metrics Tracking

After each validation run, record:
- Build time
- Type check time
- Lint time
- Test execution time
- Load test duration
- Error types and counts

Use these metrics to detect regressions early.

---

See RUNTIME_STABILITY_LOCK.md for full runtime invariant documentation.
