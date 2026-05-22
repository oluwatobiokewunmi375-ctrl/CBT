# CBT Runtime Stability: Protection & Validation Report

**Status**: 🔒 FROZEN AND PROTECTED - Runtime stability lock activated
**Date**: 2026-05-21
**Version**: 2.0
**Scope**: All UI/UX work must respect this frozen architecture
**Next Review**: Before any architectural changes

---

## Executive Summary

The CBT platform runtime has been comprehensively protected against regression through:

1. **Frozen Runtime Architecture** - Core concurrency, session, and submission logic locked
2. **Enhanced Snapshot Protection** - Database invariants validated and protected
3. **Automated Validation Gates** - CI/CD pipeline prevents regressions
4. **Feature Boundaries** - Clear boundaries between UI layer and protected runtime
5. **Runtime Guardrails** - Enforcement mechanisms for critical invariants
6. **Comprehensive Documentation** - Protected systems fully documented

**Key Result**: UI work can now proceed safely without risk of destabilizing the validated concurrent runtime.

---

## Protected Systems Summary

### 1. Session Management System ✓

**Status**: PROTECTED AND VALIDATED

**Core Invariants**:
- ✓ Single tab ownership enforced via `ownerTabId` + heartbeat timeout (30s)
- ✓ Version atomicity enforced via optimistic concurrency (updateMany with version check)
- ✓ Expiry validation enforced with 10-second grace window
- ✓ Session restore validates ownership and expiry before resuming
- ✓ Ownership transfer after heartbeat grace allows new tab to take control

**Protection Mechanisms**:
- Database schema: `Session.version`, `Session.ownerTabId`, `Session.ownerHeartbeatAt`, `Session.expiresAt`
- API logic: save-progress route checks version, ownership, and expiry
- Test coverage: snapshot-protection.test.ts + exam-resilience.spec.ts
- Load validation: load-stress.cjs measures conflict rates and ownership transfers

**Regression Risk**: ⬜ ZERO - Schema constraints prevent modifications

---

### 2. Duplicate Submission Prevention ✓

**Status**: PROTECTED AND VALIDATED

**Core Invariants**:
- ✓ ExamSubmission table has `@@unique([studentId, examId])` constraint
- ✓ Result table has `@@unique([studentId, examId])` constraint
- ✓ Second submit returns 409 (duplicate detected) - IDEMPOTENT SAFE
- ✓ Concurrent submit race prevented at database level
- ✓ Zero duplicate rows allowed under any load condition

**Protection Mechanisms**:
- Database schema: Two unique constraints prevent duplicate rows
- API logic: submit route checks for existing submission before create
- Transaction atomicity: ExamSubmission and Result created in same transaction
- Test coverage: snapshot-protection.test.ts + concurrency.submit.test.ts
- Load validation: load-stress.cjs verifies duplicate_row_count = 0

**Regression Risk**: ⬜ ZERO - Constraint removal would be caught at schema validation

---

### 3. Autosave & Progress Tracking ✓

**Status**: PROTECTED AND VALIDATED

**Core Invariants**:
- ✓ Idempotent saves: Identical answers return 200 without DB write
- ✓ Version conflict handling: Stale version rejected with 409
- ✓ Ownership protection: Non-owner save rejected with 409
- ✓ Answer preservation: Rejected saves never lose data
- ✓ Metrics tracking: saveProgressMetrics collected for debugging

**Protection Mechanisms**:
- API logic: save-progress route implements all checks (version, ownership, idempotency)
- Optimistic concurrency: updateMany(...where: { version: clientVersion }) ensures atomicity
- Metrics collection: Conflict rates tracked and exposed for analysis
- Test coverage: snapshot-protection.test.ts + load-stress.cjs
- Load validation: Measures ownership conflict, version conflict, idempotent save rates

**Regression Risk**: ⬜ LOW - Version logic changes caught by tests

---

### 4. Expiry & Grace Window Enforcement ✓

**Status**: PROTECTED AND VALIDATED

**Core Invariants**:
- ✓ expiresAt is server-authoritative, computed from exam.duration
- ✓ 10-second grace window allows final submit/save retries
- ✓ Beyond grace window, session marked EXPIRED and operations blocked
- ✓ All time-based checks use `expiresAt + GRACE_MS` formula
- ✓ Grace window value (10s) is a protected constant

**Protection Mechanisms**:
- Server logic: All routes check expiry before accepting writes
- Grace window constant: GRACE_MS = 10 * 1000 hardcoded in routes
- Test coverage: snapshot-protection.test.ts validates grace window behavior
- Load validation: Confirms session expiry boundary respected

**Regression Risk**: ⬜ MEDIUM - Grace window constant could be changed; catch by tests

---

### 5. Multi-Tab Ownership & Heartbeat ✓

**Status**: PROTECTED AND VALIDATED

**Core Invariants**:
- ✓ Only owner tab (ownerTabId) can save/submit during active heartbeat
- ✓ Heartbeat timeout = 30 seconds of inactivity
- ✓ After 30s inactivity, new tab can take ownership via restore
- ✓ Ownership transfer prevents data corruption from stale tabs
- ✓ Heartbeat updated on every owner activity

**Protection Mechanisms**:
- API logic: save-progress and submit routes check ownerTabId + heartbeat
- Heartbeat timeout: HEARTBEAT_TIMEOUT_MS = 30 * 1000 hardcoded
- Restore route: Allows ownership transfer when heartbeat stale
- Test coverage: snapshot-protection.test.ts + exam-resilience.spec.ts
- Load validation: Measures ownership conflict rates and transfer success

**Regression Risk**: ⬜ MEDIUM - Timeout value could be changed; catch by tests

---

## Validation & Test Coverage

### Test Suites

#### 1. Runtime Lock Validation Suite
**File**: `__tests__/runtime-lock-validation.test.ts`
**Scope**: Session management invariants, submission duplicate prevention, concurrency conflict handling
**Run**: `npm test`
**Expected**: All tests pass ✓

**Test Cases**:
- Session creation with correct version, ownerTabId, expiresAt
- Session version increment on state change
- Ownership enforcement on save/submit
- Expiry validation with grace window
- Duplicate submission prevention
- Concurrent access scenarios

---

#### 2. Snapshot Protection Suite
**File**: `__tests__/snapshot-protection.test.ts`
**Scope**: Database schema invariants, critical runtime flows
**Run**: `npm test -- __tests__/snapshot-protection.test.ts`
**Expected**: All tests pass ✓

**Test Cases**:
- Session version atomicity (correct version updates, stale version rejected)
- Ownership transfer after grace window
- Duplicate prevention via unique constraints
- Grace window boundary behavior
- Session restore with ownership validation
- Heartbeat update semantics

---

#### 3. Concurrency Submit Stress Test
**File**: `__tests__/concurrency.submit.test.ts`
**Scope**: Concurrent submit scenarios under stress
**Run**: `npm test -- __tests__/concurrency.submit.test.ts`
**Expected**: All tests pass, zero duplicate submissions ✓

**Test Cases**:
- 10+ concurrent submit attempts on same exam
- Duplicate prevention at transaction level
- Database constraint violation handling
- Idempotent submit behavior

---

#### 4. Playwright Resilience Tests
**File**: `tests-e2e/exam-resilience.spec.ts`
**Scope**: Full browser-based exam workflows
**Run**: `npx playwright test tests-e2e/exam-resilience.spec.ts`
**Expected**: All tests pass ✓

**Test Cases**:
- Exam start and session creation
- Session restore on page refresh
- Autosave under multi-tab scenario
- Ownership enforcement across tabs
- Duplicate submission detection
- Session expiry and grace window
- Offline recovery behavior
- Stress testing with concurrent tabs

---

#### 5. Load & Concurrency Test
**File**: `scripts/load-stress.cjs`
**Scope**: 25+ concurrent students, real network conditions
**Run**: `node scripts/load-stress.cjs --students=25`
**Expected**: Zero duplicate submissions, <15% 409 conflict rate ✓

**Metrics Collected**:
- Login success rate (target: 100%)
- Start session success rate (target: 100%)
- Restore session success rate (target: 100%)
- Autosave conflict rates by type:
  - Version conflicts (expected: 0-5%)
  - Ownership conflicts (expected: 0-10%)
  - Idempotent saves (metrics only)
- Submit success rate (target: 100%)
- Duplicate row count (target: 0)
- Latency P95 (monitor for regressions)

---

## Validation Commands

All of these must pass before code can merge:

```bash
# Type safety
npm run type-check

# Code quality
npm run lint

# Production build
npm run build

# Unit & integration tests
npm test

# Runtime lock validation
npm test:runtime

# E2E resilience tests
npx playwright test tests-e2e/exam-resilience.spec.ts --workers=1

# Load test (25 concurrent students)
node scripts/load-stress.cjs --students=25

# Run all validation
npm run validate:all
```

**CI/CD Integration**: All commands run automatically on PR. PR cannot merge if any fails.

---

## Protected API Contracts

### Session Model (DO NOT MODIFY)

```typescript
model Session {
  id                String    @id @default(uuid())
  studentId         String    // FK to Student
  examId            String    // FK to Exam
  
  // PROTECTED: Version Atomicity
  version           Int       @default(1)  // Increments on every state change
  
  // PROTECTED: Ownership Enforcement
  ownerTabId        String?   // ID of browser tab that owns this session
  ownerHeartbeatAt  DateTime? // Last heartbeat timestamp from owner
  
  // PROTECTED: Expiry Enforcement
  expiresAt         DateTime? // Server-authoritative expiry time
  
  // PROTECTED: Answer Preservation
  answersJson       Json?     // All student answers stored here
  lastSavedAt       DateTime? // Last successful autosave timestamp
  
  // Session State
  status            String    @default("ACTIVE")   // ACTIVE | COMPLETED | EXPIRED | ABANDONED
  startedAt         DateTime  @default(now())
  completedAt       DateTime?
  timeTakenSeconds  Int?
  
  @@index([studentId, examId])
}
```

**INVARIANTS** (DO NOT CHANGE):
- ✓ `version` starts at 1, increments on every state change
- ✓ `ownerTabId` identifies the browser tab that can save/submit
- ✓ `ownerHeartbeatAt` is updated on owner activity, used to determine timeout
- ✓ `expiresAt` is server-authoritative and used to enforce submission deadline
- ✓ `answersJson` stores all answers for session restore
- ✓ No other session state stored outside the database

---

### ExamSubmission Model (DO NOT MODIFY)

```typescript
model ExamSubmission {
  id          String   @id @default(cuid())
  studentId   String   // FK to Student
  examId      String   // FK to Exam
  
  answers     String   // JSON of answers
  score       Int
  totalMarks  Int
  percentage  Float
  grade       String
  timeSpent   Int
  status      String   @default("SUBMITTED")
  
  createdAt   DateTime @default(now())
  
  // PROTECTED: Duplicate Prevention
  @@unique([studentId, examId])
  student     Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  exam        Exam     @relation(fields: [examId], references: [id], onDelete: Cascade)
}
```

**INVARIANTS** (DO NOT CHANGE):
- ✓ `@@unique([studentId, examId])` prevents duplicate submissions at DB level
- ✓ This constraint MUST NOT be removed or weakened
- ✓ Duplicate attempts return 409 (Conflict) - this is EXPECTED and SAFE
- ✓ Constraint violation is the PRIMARY protection mechanism

---

### Result Model (DO NOT MODIFY)

```typescript
model Result {
  id          String   @id @default(uuid())
  studentId   String   // FK to Student
  examId      String   // FK to Exam
  schoolId    String   // FK to School
  
  score       Float
  totalMarks  Float
  percentage  Float
  grade       String
  answers     String   // JSON of answers
  timeSpent   Int
  status      String   @default("SUBMITTED")
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // PROTECTED: Duplicate Prevention
  @@unique([studentId, examId])
  student     Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  exam        Exam     @relation(fields: [examId], references: [id], onDelete: Cascade)
  school      School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
}
```

**INVARIANTS** (DO NOT CHANGE):
- ✓ `@@unique([studentId, examId])` prevents duplicate results at DB level
- ✓ This constraint MUST NOT be removed or weakened
- ✓ Result and ExamSubmission created atomically in same transaction

---

## API Routes (Protected Critical Sections)

### POST /api/exam/start
**Status**: PROTECTED CRITICAL SECTION
**Function**: Create or resume exam session
**Invariants**:
- ✓ Session uniqueness: Only one ACTIVE session per (student, exam)
- ✓ Version initialization: New sessions start with version=1
- ✓ Ownership assignment: ownerTabId assigned and validated
- ✓ Expiry enforcement: expiresAt computed from exam.duration
- ✓ Heartbeat initialization: ownerHeartbeatAt set when owner established

**DO NOT MODIFY**: Session version semantics, ownerTabId logic, expiresAt calculation

---

### POST /api/exam/save-progress
**Status**: PROTECTED CRITICAL SECTION
**Function**: Autosave exam progress with optimistic concurrency
**Invariants**:
- ✓ Ownership enforcement: Only ownerTabId can save
- ✓ Version atomicity: sessionVersion must match or save rejected (409)
- ✓ Idempotent saves: Identical answers no-op (200, no DB write)
- ✓ Stale-save handling: Old clientUpdatedAt rejected (409)
- ✓ Answer preservation: Rejected saves never lose data

**DO NOT MODIFY**: Version conflict logic, ownership validation, idempotent logic, session update semantics

---

### POST /api/exam/submit
**Status**: PROTECTED CRITICAL SECTION
**Function**: Final submission with atomic scoring
**Invariants**:
- ✓ Ownership enforcement: Only ownerTabId can submit
- ✓ Expiry enforcement: Cannot submit after expiresAt + 10s grace
- ✓ Duplicate prevention: At most one ExamSubmission per (student, exam)
- ✓ Atomic scoring: ExamSubmission and Result created together
- ✓ Idempotent submit: Multiple submits return same score

**DO NOT MODIFY**: Unique constraints, ownership check, expiry grace window (10s), transaction semantics

---

## Feature Boundaries: UI Layer Constraints

### ❌ UI CANNOT:

1. **Directly mutate runtime session state**
   - Cannot modify `version`, `ownerTabId`, `expiresAt`
   - Must use API routes for all state changes
   
2. **Bypass autosave hooks**
   - All answer changes must trigger autosave
   - Cannot skip save and submit directly
   
3. **Bypass submit pipeline**
   - Cannot write directly to `ExamSubmission` or `Result`
   - Must use `/api/exam/submit` route
   
4. **Bypass ownership enforcement**
   - Cannot ignore 403 ownership errors
   - Cannot modify `ownerTabId` or `ownerHeartbeatAt`
   
5. **Bypass restore/reconnect flow**
   - Cannot auto-resume expired sessions
   - Must validate expiry before showing exam
   
6. **Modify Prisma schema**
   - Cannot remove unique constraints
   - Cannot add new session state without DB backing

### ✅ UI CAN:

1. **Display layer changes** - Redesign exam interface, question cards, timer display
2. **UX improvements** - Better error messaging, autosave feedback, enhanced timers
3. **Local state management** - Redux/Zustand for UI state (answers, current question, etc.)
4. **Analytics & telemetry** - Track autosave success/failure, conflict rates, session restore times
5. **Offline & recovery** - Graceful offline indication, queue autosaves, retry on reconnect

**See FEATURE_BOUNDARIES.md for complete UI constraints.**

---

## Runtime Guardrails & Enforcement

### Automated Validation Gates (CI/CD Pipeline)

All PRs must pass these gates before merge:

| Gate | Command | Purpose | Impact |
|------|---------|---------|--------|
| **Type Check** | `npm run type-check` | TypeScript compilation | Catches type errors in critical routes |
| **Lint** | `npm run lint` | Code quality | Ensures maintainability |
| **Build** | `npm run build` | Production compilation | Verifies deployment readiness |
| **Unit Tests** | `npm test` | Runtime lock validation | Validates concurrency logic |
| **E2E Tests** | `npx playwright test` | Full workflows | End-to-end exam scenarios |
| **Load Test** | `node scripts/load-stress.cjs --students=25` | Stress testing | Zero duplicates, conflict rates |

**CI/CD Behavior**: PR blocked if ANY gate fails. Cannot merge until all pass.

---

## Known Safe 409 Behaviors

These 409 responses are **EXPECTED and SAFE** - they indicate healthy conflict detection:

| Scenario | Root Cause | Safe Behavior | UI Action |
|----------|-----------|---------------|-----------|
| **Version Conflict** | Different tab saved between retries | Retry with new version | Fetch new version, retry autosave |
| **Ownership Conflict** | Non-owner tab tried to save | Reject write; no data loss | Show "tab ownership lost" message |
| **Stale Save** | Identical answers sent twice | No-op; 200 returned | Idempotent; no action needed |
| **Duplicate Submit** | Submit after already submitted | Check for existing ExamSubmission | Return existing score, don't retry |

**Important**: 409 is not an error - it's the system working correctly. UI must handle gracefully.

---

## Verification Procedures

### Pre-Merge Checklist

Before any code can merge, ensure:

- [ ] All validation commands pass (npm run validate:all)
- [ ] Runtime team approval obtained
- [ ] No protected invariants modified
- [ ] Load test shows <5% version conflict rate
- [ ] Load test shows zero duplicate submissions
- [ ] E2E tests pass: exam resilience suite
- [ ] Unit tests pass: runtime lock + snapshot protection
- [ ] Type check passes: no TypeScript errors
- [ ] Build succeeds: production bundle created

### Emergency Escalation

If you need to modify a protected invariant:

1. **Document the requirement** - Why does it need to change?
2. **Escalate to runtime team** - Discuss alternatives
3. **Perform impact analysis** - What will break?
4. **Update all dependent systems** - Tests, docs, guardrails
5. **Notify stakeholders** - Inform affected teams

---

## Regression Prevention Strategy

### What We're Protecting Against

| Risk | Prevention | Detection |
|------|-----------|-----------|
| **Duplicate submissions** | Schema constraint + transaction atomicity | Load test verifies duplicate_row_count = 0 |
| **Multi-tab data corruption** | Ownership enforcement + heartbeat timeout | E2E tests multi-tab scenarios |
| **Session version conflicts** | Optimistic concurrency check | Unit tests + load test measure conflict rates |
| **Expiry bypass** | Server-authoritative expiresAt + grace window | Tests verify grace window boundary |
| **Stale writes** | Version check before update | Unit tests verify version conflict rejection |
| **Missing answers** | answersJson always stored before submit | Tests verify answer preservation on conflicts |

### How Tests Catch Regressions

1. **Unit tests** catch logic errors in routes
2. **E2E tests** catch workflow regressions
3. **Load tests** catch concurrency regressions
4. **Type checks** catch signature changes
5. **Lint checks** catch code quality issues
6. **Build checks** catch import errors

---

## Summary: What is Protected

### Protected Systems
✅ Session version management and optimistic concurrency
✅ Ownership enforcement and multi-tab protection  
✅ Duplicate submission prevention at schema level
✅ Autosave idempotency and conflict handling
✅ Expiry enforcement with 10-second grace window
✅ Answer preservation and recovery
✅ Atomic submission transactions
✅ Ownership heartbeat and transfer logic

### Protected API Contracts
✅ ExamSubmission.@@unique([studentId, examId])
✅ Result.@@unique([studentId, examId])
✅ Session.version atomicity
✅ Session.ownerTabId enforcement
✅ Session.expiresAt calculation
✅ 10-second grace window
✅ 30-second ownership heartbeat timeout

### Protected Invariants
✅ One active session per (student, exam)
✅ Version starts at 1, increments atomically
✅ Only owner tab can save/submit
✅ Zero duplicate submissions possible
✅ Expiry is server-authoritative
✅ 10s grace window before hard deadline
✅ 30s before ownership transfer
✅ All answers preserved on conflict

---

## Remaining Safe Extension Points

### UI Can Implement

✅ Display and styling improvements
✅ UX enhancements (timers, progress, feedback)
✅ Local state management (Redux/Zustand)
✅ Client-side validation
✅ Analytics and telemetry
✅ Offline support with IndexedDB
✅ Keyboard navigation and accessibility
✅ Animations and microinteractions

### Features Can Add

✅ Better error messages (with conflict understanding)
✅ Autosave feedback (spinner, checkmark)
✅ Ownership recovery UI (timer to reclaim)
✅ Offline queue status
✅ Connection status indicator
✅ Timer warnings
✅ Answer validation feedback

### Data Can Analyze

✅ Autosave success/failure rates
✅ 409 conflict type breakdown
✅ Session restore latency
✅ Submit completion rate
✅ User session duration
✅ Device and platform metrics
✅ Performance metrics

---

## Conclusion

The CBT platform runtime is now **FROZEN AND PROTECTED**:

1. ✅ All critical invariants documented
2. ✅ All schema constraints validated  
3. ✅ All API contracts protected
4. ✅ Comprehensive test coverage in place
5. ✅ Automated validation gates configured
6. ✅ Feature boundaries clearly defined
7. ✅ UI layer constraints documented
8. ✅ Emergency procedures established

**UI work can now proceed with confidence** that the validated concurrent runtime will not be accidentally destabilized.

**DO NOT bypass these protections. DO escalate conflicts to the runtime team.**

---

## Reference Documents

- [RUNTIME_STABILITY_LOCK.md](RUNTIME_STABILITY_LOCK.md) - Core runtime invariants and protected systems
- [FEATURE_BOUNDARIES.md](FEATURE_BOUNDARIES.md) - UI layer constraints and safe extension points
- [RUNTIME_GUARDRAILS.md](RUNTIME_GUARDRAILS.md) - Automated validation gates and enforcement
- [__tests__/snapshot-protection.test.ts](__tests__/snapshot-protection.test.ts) - Snapshot tests
- [__tests__/runtime-lock-validation.test.ts](__tests__/runtime-lock-validation.test.ts) - Runtime lock tests
- [tests-e2e/exam-resilience.spec.ts](tests-e2e/exam-resilience.spec.ts) - E2E resilience tests
- [scripts/load-stress.cjs](scripts/load-stress.cjs) - Load testing and validation

---

**🔒 RUNTIME FROZEN - UI WORK CAN PROCEED SAFELY 🔒**
