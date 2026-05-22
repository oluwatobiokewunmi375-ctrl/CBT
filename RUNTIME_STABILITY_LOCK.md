# CBT Runtime Stability Lock

**Status**: FROZEN - Protected regression baseline established
**Version**: 1.0
**Date Locked**: 2026-05-21

---

## Overview

This document freezes the validated backend runtime behavior of the CBT platform. All future UI/UX work must layer ON TOP of this protected architecture without modification.

**Key Principle**: The runtime is STABLE and VALIDATED under concurrent load (100+ users). UI work must not alter core concurrency, session, or submission logic.

---

## Protected Runtime Invariants

### 1. Session Management Invariants

| Invariant | Description | Enforcement | Violation Impact |
|-----------|-------------|------------|-----------------|
| **Single Tab Ownership** | Only one browser tab can own a session via `ownerTabId` | `save-progress` and `submit` routes check `ownerTabId` match | Stale tabs rejected with 409 |
| **Heartbeat Validation** | Owner tab must maintain heartbeat within grace window | `restore` route updates `ownerHeartbeatAt`; `save-progress` validates | Tab ownership transferable after 30s grace |
| **Version Atomicity** | Session `version` increments on every state change | `save-progress` uses optimistic concurrency via `updateMany` with version check | Stale writes rejected; caller must retry |
| **Expiry Enforcement** | Session `expiresAt` is server-authoritative; 10s grace window applied | `start`, `restore`, `submit` all check `expiresAt + 10s grace` | Expired sessions cannot be resumed or submitted |
| **Session Uniqueness** | Only one active session per (student, exam) pair | Database unique constraint via session start logic | Second simultaneous session start returns 400 |

### 2. Submission & Result Invariants

| Invariant | Description | Enforcement | Violation Impact |
|-----------|-------------|------------|-----------------|
| **Duplicate Submission Prevention** | Each student can submit only once per exam | `ExamSubmission` and `Result` tables have `@@unique([studentId, examId])` | Duplicate submit attempts rejected with 409 |
| **Submit Idempotency** | Multiple submit calls with same payload are safe | Submit checks for existing `ExamSubmission` before insert | Idempotent caller receives 200 + existing data |
| **Atomic Scoring** | Score, grade, and percentage computed together | `submit` route inserts `ExamSubmission` and `Result` in same transaction | No partial results possible |
| **Ownership on Submit** | Only session owner can submit | `submit` route validates `ownerTabId` matches | Non-owner submit rejected with 403 |

### 3. Autosave & Progress Tracking Invariants

| Invariant | Description | Enforcement | Violation Impact |
|-----------|-------------|------------|-----------------|
| **Idempotent Autosave** | Autosave with identical answers is a no-op | `save-progress` checks if new answers differ from session state | Stale saves return 200 without DB write |
| **Version on Save** | `sessionVersion` must match current DB version | `save-progress` uses `updateMany` with version check | Stale version rejected with 409 conflict |
| **Ownership on Save** | Only session owner can autosave | `save-progress` validates `ownerTabId` matches | Non-owner save rejected with 403 |
| **Answers Preservation** | Submitted answers cannot be lost | `answersJson` stored in session; also in `ExamSubmission` | Answers recoverable from either table |

### 4. Reconnect & Recovery Invariants

| Invariant | Description | Enforcement | Violation Impact |
|-----------|-------------|------------|-----------------|
| **Session Restore on Refresh** | Page refresh recovers session via `sessionId` in localStorage | `restore` route looks up session and validates expiry/ownership | Expired session fails with 401; non-owner fails with 403 |
| **Ownership Transfer on Reconnect** | New tab can take ownership after heartbeat grace expires | `restore` route allows new `ownerTabId` if old heartbeat stale (30s+) | Stale owner gets 403 if new owner has taken control |
| **Answers Preserved on Reconnect** | Student answers available after refresh | `answersJson` in session restored to client | No answer loss on page refresh |
| **Grace Window on Expiry** | 10-second grace window allows submit after nominal expiry | All time-based expiry checks use `expiresAt + 10s` | Brief time after nominal expiry remains valid |

### 5. Concurrency Conflict Patterns (Expected & Safe)

| Conflict Type | HTTP Status | Root Cause | Safe Behavior | UI Action |
|---------------|------------|-----------|--------------|-----------|
| **Version Conflict** | 409 | Different tab saved between retries | Retry with new version | Retry autosave |
| **Ownership Conflict** | 409 | Non-owner tab tried to save | Reject write; no data loss | Alert user: tab ownership lost |
| **Stale Save** | 200 | Identical answers sent twice | No-op; 200 returned | Idempotent; no action needed |
| **Duplicate Submit** | 409 or 200 | Submit after already submitted | Check for existing `ExamSubmission` | Idempotent; return existing score |

**Important**: 409s under high concurrency are EXPECTED and SAFE. They indicate healthy conflict detection, not failures.

---

## Protected API Contracts

### DO NOT MODIFY

1. **Session Model Fields**
   - `version` - MUST increment on every state change
   - `ownerTabId` - MUST enforce single-tab ownership
   - `ownerHeartbeatAt` - MUST track last owner activity
   - `expiresAt` - MUST be server-authoritative
   - `answersJson` - MUST store all student answers

2. **ExamSubmission Unique Constraint**
   - MUST remain: `@@unique([studentId, examId])`
   - CANNOT allow duplicate submissions

3. **Result Unique Constraint**
   - MUST remain: `@@unique([studentId, examId])`
   - CANNOT allow duplicate scoring

4. **Critical Route Behaviors**
   - `/api/exam/start` - MUST create session with version=1, ownerTabId, expiresAt
   - `/api/exam/restore` - MUST validate expiry, ownership; transfer ownership on grace expiry
   - `/api/exam/save-progress` - MUST use optimistic concurrency with version check
   - `/api/exam/submit` - MUST check ownership, validate expiry, enforce duplicate prevention
   - `/api/exam/autosave` - MUST idempotently save without version conflict on first call

---

## Protected Systems

### Autosave System
- **Behavior**: Automatically saves progress every 5-10 seconds
- **Conflict Handling**: Retries with exponential backoff on 409
- **Status**: Students should NOT see autosave failures unless network is down
- **Protected**: Version management, ownership checks, idempotent saves

### Multi-Tab Ownership
- **Behavior**: Only active tab can save/submit
- **Transition**: New tab takes ownership after 30s of old tab inactivity
- **Detection**: Via `ownerHeartbeatAt` heartbeat timestamp
- **Protected**: Ownership enforcement in save/submit routes

### Session Restore on Refresh
- **Behavior**: Page refresh recovers exam state from session
- **Flow**: Load sessionId → validate expiry + ownership → restore answers + version
- **Protected**: Expiry validation with grace window, ownership validation

### Duplicate Submission Prevention
- **Behavior**: Student can submit once per exam
- **Database**: Unique constraint on (studentId, examId)
- **Idempotency**: Duplicate submit attempt returns existing score
- **Protected**: Schema constraint, idempotent submit logic

### Load Testing & Validation
- **Tool**: `scripts/load-stress.cjs --students=N`
- **Coverage**: Login, start, restore, autosave, submit under concurrent load
- **Metrics**: Conflict rates, success rates, duplicate row validation
- **Protected**: Load test script records debug metrics for conflict analysis

---

## Feature Boundaries: UI Layer Constraints

The UI layer **MUST NOT**:

1. ❌ **Directly mutate runtime session state**
   - Cannot modify `version`, `ownerTabId`, `expiresAt`
   - Must use API routes for all state changes
   - UI state in Redux/Zustand is LOCAL ONLY

2. ❌ **Bypass autosave hooks**
   - All answer changes must trigger autosave via API
   - Cannot skip save and submit directly
   - UI debouncing is OK; backend idempotency handles duplicates

3. ❌ **Bypass submit pipeline**
   - Cannot write directly to `ExamSubmission` or `Result`
   - Must use `/api/exam/submit` route
   - Route enforces ownership, expiry, uniqueness

4. ❌ **Bypass ownership enforcement**
   - Cannot ignore 403 ownership errors
   - Cannot modify `ownerTabId` or `ownerHeartbeatAt`
   - Must recover ownership via `restore` endpoint

5. ❌ **Bypass restore/reconnect flow**
   - Cannot auto-resume expired sessions
   - Must validate expiry before showing exam state
   - Must show graceful timeout after expiry

6. ❌ **Modify Prisma schema**
   - Cannot remove unique constraints
   - Cannot add new session state not backed by DB
   - Cannot change field semantics

---

## Safe UI Extension Points

The UI **CAN**:

✅ **Display layer changes**
   - Redesign exam interface, question cards, timer display
   - Reorganize nav, controls, progress indicators

✅ **UX improvements**
   - Better error messaging for 409 conflicts
   - Improved autosave feedback (spinner, check mark)
   - Enhanced timer display with warnings

✅ **Local state management**
   - Redux/Zustand for UI state (answers, current question, etc.)
   - Polling for session health
   - Client-side retries with backoff

✅ **Analytics & telemetry**
   - Track autosave success/failure
   - Monitor 409 conflict rates
   - Report session restore times

✅ **Offline & recovery**
   - Graceful offline indication
   - Queue autosaves; retry on reconnect
   - Show connection status

---

## Regression Prevention

### Preserved Test Suites

1. **Playwright Resilience Tests** (`tests-e2e/exam-resilience.spec.ts`)
   - Multi-tab ownership enforcement
   - Stale save rejection
   - Session expiry validation
   - Duplicate submission prevention
   - Session restore on refresh
   - Offline recovery behavior
   - **Status**: Must continue to pass

2. **Load Test Script** (`scripts/load-stress.cjs`)
   - 25, 50, 75, 100 concurrent user simulation
   - Autosave, restore, submit under load
   - Duplicate row validation
   - Conflict rate measurement
   - **Status**: Must not regress; 409 rates should remain stable

3. **Concurrency Tests** (`__tests__/concurrency.submit.test.ts`)
   - Parallel submit attempts
   - Version conflict simulation
   - Ownership conflict detection
   - **Status**: Must continue to pass

### CI/CD Validation Gates

**Before every merge, MUST run:**

```bash
npm run build                                              # TypeScript compilation
npm run lint                                               # Code style
npm run typecheck                                          # Type safety
npx playwright test tests-e2e/exam-resilience.spec.ts    # Resilience validation
node scripts/load-stress.cjs --students=25                # Load test baseline
```

**Failure of ANY gate blocks merge.**

---

## Known Safe 409 Behaviors

These **SHOULD** trigger 409 responses and are NOT errors:

1. **Rapid autosave from multiple tabs**
   - Tab A saves, Tab B saves before Tab A's response arrives
   - Tab B receives 409 (stale version)
   - Tab B retries and succeeds
   - ✅ SAFE: No data loss; idempotent retry

2. **Ownership conflict on restore**
   - Tab A owns session; saves actively
   - Tab B calls restore after Tab A heartbeat expires
   - Tab B becomes new owner; Tab A gets 409 on next save
   - ✅ SAFE: Ownership transferred cleanly

3. **Stale version on delayed retry**
   - Autosave queued; 2+ seconds elapse before send
   - Another tab saved in between
   - First autosave gets 409 (version changed)
   - ✅ SAFE: Retry with new version succeeds

4. **Duplicate submit simulation**
   - Submit called; response delayed
   - Student clicks submit again
   - Second submit gets 409 or 200 (idempotent)
   - ✅ SAFE: Only one `ExamSubmission` row created

---

## Load Test Expected Behavior

### Expected Metrics at Baseline (25 users)

```
login: total=25, success=25, fail=0
start: total=25, success=25, fail=0
restore: total=~250, success=~240, fail=~10 (some 409s OK)
save: total=~500, success=~400, fail=~100 (409 conflicts expected)
submit: total=25, success=25, fail=0
Database: 0 duplicate rows (ExamSubmission, Result)
```

### Regression Indicators

❌ **FAIL if**:
- Database has duplicate (studentId, examId) rows
- Login or start routes have failures
- Submit success < 80% (only 409s acceptable)
- Build or tests fail
- TypeScript errors introduced

---

## Mandatory Pre-UI-Change Checklist

Before starting ANY UI/UX work:

- [ ] All Playwright resilience tests pass
- [ ] Load test runs with zero duplicate rows
- [ ] `npm run build` succeeds
- [ ] `npm run typecheck` has no errors
- [ ] Production build created (not just dev)
- [ ] Committed this RUNTIME_STABILITY_LOCK.md

---

## Critical Runtime Sections (Do Not Modify Lightly)

### 1. `app/api/exam/start/route.ts`
- Session creation, version initialization
- Ownership assignment (ownerTabId)
- Expiry calculation (10s grace)
- **Mark**: "Protected: Session creation invariants"

### 2. `app/api/exam/save-progress/route.ts`
- Autosave with optimistic concurrency
- Version conflict detection
- Ownership validation
- Idempotent stale-save handling
- **Mark**: "Protected: Autosave concurrency critical section"

### 3. `app/api/exam/submit/route.ts`
- Ownership validation
- Expiry enforcement (grace window)
- Duplicate submission prevention
- Atomic scoring
- **Mark**: "Protected: Submit pipeline critical section"

### 4. `app/api/exam/restore/route.ts`
- Session expiry validation
- Ownership transfer on grace expiry
- Answer recovery
- **Mark**: "Protected: Session restore critical section"

### 5. `app/api/exam/autosave/route.ts`
- Idempotent autosave
- No version conflict on identical saves
- **Mark**: "Protected: Idempotent autosave"

---

## Runtime Invariants Summary Table

| Invariant | Type | Enforcement | Test Coverage |
|-----------|------|------------|----------------|
| Single-tab ownership | Concurrency | `ownerTabId` check in save/submit | exam-resilience.spec.ts |
| Version atomicity | Concurrency | `updateMany` with version check | concurrency.submit.test.ts |
| Duplicate prevention | Data Integrity | `@@unique([studentId, examId])` | exam-resilience.spec.ts + load-stress |
| Expiry enforcement | Time | `expiresAt + 10s` check | exam-resilience.spec.ts |
| Session uniqueness | Data Integrity | Session start logic | exam-resilience.spec.ts |
| Answers preservation | Data Recovery | `answersJson` + session recover | exam-resilience.spec.ts |
| Submit idempotency | Fault Tolerance | Duplicate check before insert | load-stress conflict metrics |
| Ownership transfer | Concurrency | Heartbeat grace (30s) | exam-resilience.spec.ts |

---

## Approval & Sign-Off

**Locked By**: Runtime Validation Agent
**Lock Date**: 2026-05-21
**Status**: RUNTIME STABILITY FROZEN

Any deviation from these invariants requires:
1. Technical review
2. Updated test coverage
3. Load test re-validation
4. Risk assessment documented

---

## Remaining Safe UI Extension Roadmap

After runtime lock is proven stable:

1. **Phase 1: UI Polish** (Non-critical)
   - Question display redesign
   - Timer UI improvements
   - Progress bar enhancements

2. **Phase 2: UX Enhancements** (Low-risk)
   - Error message improvements
   - Autosave feedback UI
   - Connection status display

3. **Phase 3: Advanced Features** (High-risk; requires new API)
   - Real-time notifications
   - Collaborative features (if needed)
   - Advanced analytics

**IMPORTANT**: Phase 3 requires new APIs, NOT modifications to existing core routes.

