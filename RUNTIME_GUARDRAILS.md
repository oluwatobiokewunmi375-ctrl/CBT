# CBT Runtime Guardrails

**Status**: ENFORCED - Automated guardrails and validation gates active
**Version**: 1.0
**Enforced**: Yes - CI/CD pipeline validates before merge

---

## Overview

This document defines the automated guardrails that protect the CBT runtime from regression during development. These checks run in CI/CD and must pass before any code can merge.

---

## Mandatory Pre-Merge Validation Gates

Every pull request must pass these validation gates before merge:

### 1. **Type Safety**
```bash
npm run type-check
```
- Ensures no TypeScript compilation errors
- Catches type mismatches in API contracts
- Prevents undefined property access in critical routes

**Protected**: Route signatures, session object shape, submission data contracts

---

### 2. **Lint & Code Quality**
```bash
npm run lint
```
- Enforces code style consistency
- Detects unused imports and variables
- Flags potential logic errors

**Protected**: Code maintainability, reduces bugs in critical sections

---

### 3. **Production Build**
```bash
npm run build
```
- Ensures app compiles for production
- Validates all imports and dependencies
- Optimizes bundle for performance

**Protected**: Deployment readiness, no runtime import errors

---

### 4. **Unit & Integration Tests**
```bash
npm test
```
- Runtime lock validation suite (concurrent scenarios)
- Concurrency stress tests (duplicate submit prevention)
- Snapshot protection tests (flow invariants)
- Auth and security tests

**Protected**: Session version management, ownership enforcement, duplicate prevention

---

### 5. **E2E Resilience Tests**
```bash
npx playwright test tests-e2e/exam-resilience.spec.ts
```
- Full browser-based exam workflow (start → restore → autosave → submit)
- Multi-tab ownership scenarios
- Network error recovery
- Session expiry and grace window
- Duplicate submission detection

**Protected**: End-to-end user flows, data preservation, resilience under stress

---

### 6. **Load & Concurrency Testing**
```bash
node scripts/load-stress.cjs --students=25
```
- Simulates 25 concurrent students
- Validates autosave conflict rates (409 expected, safe)
- Confirms zero duplicate submissions
- Measures latencies and tracks debug metrics
- Verifies server stability under load

**Protected**: Concurrent access patterns, duplicate prevention at scale, performance

---

## Automated CI/CD Pipeline

### GitHub Actions / CI Workflow

```yaml
name: Runtime Stability Check

on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Build
        run: npm run build
      
      - name: Unit tests
        run: npm test
      
      - name: E2E tests (resilience)
        run: npx playwright test tests-e2e/exam-resilience.spec.ts
      
      - name: Load test
        run: node scripts/load-stress.cjs --students=25
```

**Result**: PR cannot merge if any step fails.

---

## Protected Systems & What They Validate

### Session Version Management
**Validation**: `npm test` (snapshot-protection.test.ts)
- Version starts at 1 ✓
- Version increments on save ✓
- Stale version (client < server) rejected (409) ✓
- Correct version (client === server) succeeds ✓
- Version is atomic with data changes ✓

### Ownership Enforcement
**Validation**: `npm test` + `npx playwright test exam-resilience.spec.ts`
- Only owner tab can save/submit ✓
- 409 returned if non-owner attempts save ✓
- Ownership transfers after 30s grace (heartbeat stale) ✓
- Heartbeat updated on every owner action ✓
- Non-owner within grace window is blocked ✓

### Duplicate Submission Prevention
**Validation**: `npx playwright test` + `node scripts/load-stress.cjs`
- ExamSubmission unique constraint exists ✓
- Result unique constraint exists ✓
- Second submit returns 409 (duplicate detected) ✓
- Duplicate row count = 0 in load test ✓
- Concurrent submit race prevented at DB ✓

### Expiry Enforcement
**Validation**: `npm test` + `npx playwright test`
- Session expiry + 10s grace computed correctly ✓
- Save/submit blocked beyond grace window ✓
- Session marked EXPIRED after grace expires ✓
- Restore validates expiry before returning ✓
- Grace window is exactly 10 seconds ✓

### Autosave Idempotency
**Validation**: `npm test` + load stress
- Identical answers = no-op (200 returned) ✓
- Stale version = 409 conflict ✓
- Version conflict resolved via retry + new version ✓
- Ownership conflict = 409, can retry ✓
- Metrics tracked: idempotent vs real saves ✓

### Atomic Transactions
**Validation**: `npm test` (concurrency.submit.test.ts)
- ExamSubmission and Result created together ✓
- No partial results possible ✓
- Transaction atomicity enforced by Prisma ✓
- Constraint violations caught at DB level ✓

---

## Guardrail Violations & How to Recover

### ❌ If `npm run type-check` fails:

**Impact**: Type mismatch in critical route
**Action**:
1. Identify type error in output
2. Fix TypeScript violations
3. Ensure route signatures match contracts (see RUNTIME_STABILITY_LOCK.md)

```bash
# Find the error
npm run type-check

# Fix locally
# Ensure no modifications to API contracts

# Re-run
npm run type-check
```

### ❌ If `npm test` fails:

**Impact**: Runtime lock or concurrency logic broken
**Action**:
1. Check which test failed (runtime-lock, snapshot, concurrency, etc.)
2. Identify what was changed
3. Revert changes to protected routes or schema
4. Run test again to verify

```bash
# Run only failing test
npm test -- __tests__/snapshot-protection.test.ts

# Check what changed
git diff app/api/exam/

# Review RUNTIME_STABILITY_LOCK.md for protected invariants
```

### ❌ If `npm run build` fails:

**Impact**: Production build broken
**Action**:
1. Check build error (import issues, undefined references)
2. Fix imports and references
3. Verify no API contract changes
4. Rebuild

```bash
npm run build
# Fix errors
npm run build
```

### ❌ If `npx playwright test` fails:

**Impact**: E2E workflow broken
**Action**:
1. Check which test case failed (ownership, expiry, submit, etc.)
2. Verify relevant API route wasn't modified
3. If API was modified, ensure invariants still hold
4. Re-run test

```bash
# Run specific test
npx playwright test tests-e2e/exam-resilience.spec.ts --grep "submit ownership"

# Review what changed in related API route
git diff app/api/exam/submit/

# Check FEATURE_BOUNDARIES.md for UI constraints
```

### ❌ If `node scripts/load-stress.cjs` reports high 409 rate (>50%):

**Expected 409 rates**:
- Version conflicts (stale version): 0-5% (healthy)
- Ownership conflicts (tab switch): 0-10% (expected with multi-tab)
- **Stale save (duplicate): 0%** (should be zero)

**If 409 > 15%**:
1. Check save-progress route for version logic changes
2. Verify version conflict detection is working
3. Run smaller test: `node scripts/load-stress.cjs --students=5` and review metrics

**If duplicate rows > 0**:
1. CRITICAL: Schema constraint may have been removed
2. Check Prisma schema for `@@unique([studentId, examId])`
3. Verify constraint is still present on ExamSubmission
4. Verify constraint is still present on Result
5. Run integrity check: `npm run verify`

### ❌ If `npm run verify` reports constraint violations:

**Impact**: Database integrity compromised
**Action**:
1. Check what integrity check failed
2. If duplicate submissions found: restore schema constraint
3. If missing fields: restore schema fields
4. Run verification again

```bash
npm run verify
# Review output and identify what's missing
# Check RUNTIME_STABILITY_LOCK.md for schema requirements
```

---

## What Happens at Each Stage

### Local Development

**Before commit**:
```bash
npm run type-check  # Catch type errors early
npm run lint        # Fix style issues
npm test            # Quick unit tests
```

**Before push**:
```bash
npm run build       # Verify production build
npm test            # Full test suite
```

**Before creating PR**:
```bash
npx playwright test tests-e2e/exam-resilience.spec.ts  # E2E
node scripts/load-stress.cjs --students=5              # Quick load test
```

### CI/CD Pipeline (on PR)

1. ✓ Type check - 2 min
2. ✓ Lint - 1 min
3. ✓ Build - 3 min
4. ✓ Unit tests - 5 min
5. ✓ E2E tests - 10 min
6. ✓ Load test - 5 min
**Total**: ~25 minutes

**If any step fails**: PR is blocked until fixed.

### Before Merge

- All CI checks passed ✓
- Runtime team approval obtained ✓
- No protected invariants modified ✓
- Load test shows <5% conflict rate ✓
- Zero duplicate submissions ✓

---

## Metrics Dashboard

### Key Metrics Tracked

| Metric | Target | Action |
|--------|--------|--------|
| **Build Success Rate** | 100% | Fail if broken build |
| **Unit Test Pass Rate** | 100% | Fail if any test fails |
| **E2E Test Pass Rate** | 100% | Fail if resilience test fails |
| **Load Test 409 Rate** | <15% | Warn if version conflicts high |
| **Duplicate Row Count** | 0 | CRITICAL if > 0 |
| **Latency P95** | <500ms | Monitor for regressions |
| **Success Rate (load)** | >98% | Warn if drop |

### Load Test Output Example

```
[load-stress] Stage 1: 25 students
[load-stress] Start: 25 success, 0 failed
[load-stress] Restore: 25 success, 0 failed
[load-stress] Save: 245 success, 5 conflicts (409 - expected)
[load-stress] Submit: 25 success, 0 duplicates
[load-stress] Duplicate row count: 0 ✓
[load-stress] P95 latency: 245ms ✓
```

---

## Emergency Procedures

### If Critical Invariant Is Broken

**Symptom**: Duplicate submissions detected or ownership check fails

**Immediate Actions**:
1. Revert PR immediately
2. Alert runtime team
3. Check schema constraints are present
4. Verify no code modified save-progress or submit routes
5. Run full validation suite again

**Prevention**: These checks should catch it at CI stage.

---

## Summary

The guardrails ensure:
- ✅ Type safety in all critical routes
- ✅ Session version management is atomic
- ✅ Ownership enforcement is respected
- ✅ Duplicate prevention works at scale
- ✅ Expiry validation is enforced
- ✅ Autosave idempotency maintained
- ✅ No architectural regressions

**DO NOT BYPASS these checks.**
**DO NOT disable any validation gate in CI.**
**DO escalate conflicts to runtime team instead of modifying protected invariants.**
