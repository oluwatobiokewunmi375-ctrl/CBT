# CBT Runtime Critical Sections Reference

**Quick Reference Guide for Protected Runtime Sections**  
**Last Updated**: 2026-05-21  
**Status**: LOCKED AND PROTECTED

---

## Critical Sections Map

### 🔴 Session Management Critical Section
**Location**: [app/api/exam/start/route.ts](app/api/exam/start/route.ts)

**What It Does**:
- Creates new exam sessions with version=1
- Assigns ownerTabId to first tab
- Calculates expiresAt from exam.duration
- Prevents duplicate active sessions

**Protected Invariants**:
- Session.version starts at 1
- Session.ownerTabId assigned on creation
- Session.expiresAt is server-authoritative
- One ACTIVE session per (student, exam)

**DO NOT MODIFY**:
- Version initialization logic
- ownerTabId assignment
- expiresAt calculation

**Test Coverage**: `npm test` → session creation tests
**E2E Coverage**: `npx playwright test` → exam start workflow

---

### 🔴 Autosave Concurrency Critical Section
**Location**: [app/api/exam/save-progress/route.ts](app/api/exam/save-progress/route.ts)

**What It Does**:
- Saves exam progress idempotently
- Enforces version atomicity (optimistic concurrency)
- Enforces ownership (ownerTabId validation)
- Tracks conflict metrics

**Protected Invariants**:
- Version must match DB version or save rejected (409)
- Only owner tab can save during grace window
- Identical answers are no-op (200, no DB write)
- Session.version incremented atomically with save

**DO NOT MODIFY**:
- Version conflict check: `updateMany(...where: { version: clientVersion })`
- Ownership validation: `ownerTabId` + `ownerHeartbeatAt` check
- Idempotent logic: `answersEqual()` comparison
- Version increment: Must be atomic with update

**Key Code Section**:
```typescript
// VERSION ATOMICITY (PROTECTED)
// Client sends version from last save/restore
// Server checks version matches before update
const updated = await prisma.session.updateMany({
  where: {
    id: sessionId,
    version: clientVersion  // ← MUST match, else returns 0 records
  },
  data: {
    answersJson: newAnswers,
    version: { increment: 1 }  // ← ATOMIC with data change
  }
});

if (updated.count === 0) {
  // Version conflict! Client has stale version
  return NextResponse.json(
    { error: "Stale session version", currentVersion: session.version },
    { status: 409 }  // ← Caller must retry with new version
  );
}
```

**Test Coverage**: `npm test` → version atomicity + ownership tests
**Load Coverage**: `node scripts/load-stress.cjs` → measures 409 conflict rates

---

### 🔴 Submit Pipeline Critical Section
**Location**: [app/api/exam/submit/route.ts](app/api/exam/submit/route.ts)

**What It Does**:
- Final submission with atomic scoring
- Enforces ownership check
- Prevents duplicate submissions via constraint
- Creates ExamSubmission and Result atomically

**Protected Invariants**:
- ExamSubmission: `@@unique([studentId, examId])` - prevents duplicates
- Result: `@@unique([studentId, examId])` - prevents duplicates
- Only ownerTabId can submit
- Cannot submit after expiresAt + 10s grace
- Score calculated on server (not client)
- ExamSubmission and Result created in same transaction

**DO NOT MODIFY**:
- Unique constraints on ExamSubmission or Result
- Ownership check (ownerTabId validation)
- Expiry grace window (must be 10 seconds)
- Transaction atomicity (must use prisma.$transaction)
- Score calculation logic

**Key Code Section**:
```typescript
// DUPLICATE PREVENTION (SCHEMA CONSTRAINT)
// Database enforces: @@unique([studentId, examId])
// This is PRIMARY protection against duplicates
try {
  const [submission] = await prisma.$transaction([
    prisma.examSubmission.create({
      data: {
        studentId: student.id,
        examId: examId,
        // ... scoring data
      }
      // ↑ If duplicate exists, constraint violation thrown
    }),
    prisma.result.create({
      data: {
        studentId: student.id,
        examId: examId,
        // ... scoring data
      }
      // ↑ Same constraint applies here
    })
    // ← Transaction atomicity: both succeed or both fail
  ]);
} catch (error) {
  if (error.code === "P2002") {
    // Unique constraint violation = duplicate submission
    // This is SAFE and EXPECTED behavior
    return NextResponse.json(
      { error: "Exam already submitted (duplicate prevented)" },
      { status: 409 }
    );
  }
}
```

**Test Coverage**: `npm test` → duplicate submission prevention + concurrency
**Load Coverage**: `node scripts/load-stress.cjs` → verifies duplicate_row_count = 0

---

### 🟡 Ownership & Heartbeat Critical Section
**Location**: [app/api/exam/save-progress/route.ts](app/api/exam/save-progress/route.ts#L140-L160) (also in submit route)

**What It Does**:
- Enforces single tab ownership
- Transfers ownership after 30s heartbeat timeout
- Prevents stale tabs from writing

**Protected Invariants**:
- ownerTabId identifies owner
- ownerHeartbeatAt tracks last owner activity
- 30-second grace window before ownership transfer
- Non-owner within grace window gets 409 Conflict

**DO NOT MODIFY**:
- Heartbeat timeout (must be 30 seconds)
- Ownership validation logic
- Grace window calculation

**Key Code Section**:
```typescript
// OWNERSHIP ENFORCEMENT (PROTECTED)
const HEARTBEAT_TIMEOUT_MS = 30 * 1000;  // 30 seconds (DO NOT CHANGE)
const now = new Date();

if (ownerTabId && session.ownerTabId && session.ownerTabId !== ownerTabId) {
  const lastHeartbeat = session.ownerHeartbeatAt?.getTime() || 0;
  const heartbeatAge = now.getTime() - lastHeartbeat;
  
  if (heartbeatAge < HEARTBEAT_TIMEOUT_MS) {
    // Owner is still active (heartbeat fresh)
    // Non-owner gets rejected
    return NextResponse.json(
      { error: "Session owned by another tab", ownerTabId: session.ownerTabId },
      { status: 409 }  // ← Caller can retry after timeout
    );
  }
  
  // Heartbeat is stale (30s+ old)
  // New tab CAN take ownership via update
  await prisma.session.update({
    where: { id: sessionId },
    data: {
      ownerTabId: ownerTabId,  // ← Transfer ownership
      ownerHeartbeatAt: now
    }
  });
}
```

**Test Coverage**: `npm test` → ownership transfer tests
**E2E Coverage**: `npx playwright test` → multi-tab scenarios

---

### 🟡 Expiry & Grace Window Critical Section
**Location**: [app/api/exam/save-progress/route.ts](app/api/exam/save-progress/route.ts#L160-L180) and [submit route](app/api/exam/submit/route.ts#L120-L140)

**What It Does**:
- Calculates server-authoritative expiresAt
- Enforces 10-second grace window
- Allows final submit/save retries within grace

**Protected Invariants**:
- expiresAt computed from startedAt + exam.duration
- Grace window is EXACTLY 10 seconds (not 5, not 15)
- Beyond grace, session marked EXPIRED
- All time checks use same formula: `expiresAt.getTime() + GRACE_MS`

**DO NOT MODIFY**:
- Grace window duration (must be 10 seconds)
- Expiry calculation formula
- Grace window constant

**Key Code Section**:
```typescript
// EXPIRY ENFORCEMENT (PROTECTED)
const GRACE_MS = 10 * 1000;  // 10 seconds (DO NOT CHANGE)

let expiresAt = session.expiresAt;
if (!expiresAt && session.startedAt) {
  // Calculate expiry from exam duration
  expiresAt = new Date(
    Math.min(
      session.startedAt.getTime() + exam.duration * 1000,
      exam.endAt ? exam.endAt.getTime() : Infinity
    )
  );
}

// Check if beyond grace window
if (expiresAt && expiresAt.getTime() + GRACE_MS <= new Date().getTime()) {
  // ← HARD BOUNDARY: No more saves or submits after this
  await prisma.session.update({
    where: { id: sessionId },
    data: { status: "EXPIRED", expiresAt }
  });
  
  return NextResponse.json(
    { error: "Session has expired" },
    { status: 400 }  // ← Not retryable
  );
}
```

**Test Coverage**: `npm test` → grace window boundary tests
**Load Coverage**: `node scripts/load-stress.cjs` → validates expiry boundary

---

## Quick Decision Tree

### "Can I modify this?"

```
Is it in a Critical Section (marked 🔴 or 🟡)?
├─ YES
│  └─ Does it change a Protected Invariant?
│     ├─ YES → ❌ ESCALATE to runtime team
│     └─ NO → ✅ Probably safe, but verify tests still pass
└─ NO
   └─ ✅ Generally safe (but run full test suite anyway)

All changes require:
  1. npm run type-check (must pass)
  2. npm run lint (must pass)
  3. npm run build (must pass)
  4. npm test (must pass)
  5. npm run validate:resilience (must pass)
```

---

## Protected Invariants Checklist

Before any merge, verify:

- [ ] `Session.version` starts at 1 ✓
- [ ] `Session.version` increments atomically with data ✓
- [ ] `ownerTabId` enforced on save/submit ✓
- [ ] `ownerHeartbeatAt` timeout is 30 seconds ✓
- [ ] `expiresAt` computed from `startedAt + duration` ✓
- [ ] Grace window is exactly 10 seconds ✓
- [ ] `ExamSubmission.@@unique([studentId, examId])` exists ✓
- [ ] `Result.@@unique([studentId, examId])` exists ✓
- [ ] Submit and score atomic in same transaction ✓
- [ ] Version conflict rejected with 409 ✓
- [ ] Ownership conflict rejected with 409 ✓
- [ ] Duplicate submit prevented by constraint ✓
- [ ] All 409s preserve data ✓

---

## Testing These Critical Sections

### Run Unit Tests
```bash
npm test
# Tests snapshot protection, runtime lock, concurrency
```

### Run E2E Tests
```bash
npx playwright test tests-e2e/exam-resilience.spec.ts --workers=1
# Tests full browser workflows
```

### Run Load Tests
```bash
node scripts/load-stress.cjs --students=25
# Tests under concurrent load
# Verifies: zero duplicates, <15% conflict rate
```

### Run All Validation
```bash
npm run validate:all
# Type check + lint + build + unit tests + E2E + load test
```

---

## Common Questions

### Q: Can I add a new field to Session?
**A**: Only if it's:
1. Database-backed (added to Prisma schema)
2. Used only in UI state (Redux/Zustand), not for runtime logic
3. Doesn't conflict with protected fields (version, ownerTabId, expiresAt)
4. All tests still pass

**DO NOT** add session state outside the database.

---

### Q: Can I change the 10-second grace window?
**A**: NO. The 10-second grace window is:
- Carefully chosen to allow final retries
- Validated by tests (changing it breaks them)
- Referenced in multiple routes
- Documented in RUNTIME_STABILITY_LOCK.md

If you need a different value, escalate to runtime team.

---

### Q: What if I need to bypass the unique constraint?
**A**: You don't. The constraint is a FEATURE, not a limitation:
- It prevents duplicate submissions automatically
- It makes idempotency automatic
- It's a schema-level guarantee
- Tests will fail if you remove it

If you think you need to bypass it, escalate to runtime team.

---

### Q: Why is everything so complicated?
**A**: Because concurrent access from multiple tabs is hard:
- Without version checking, stale writes corrupt data
- Without ownership enforcement, non-owner tabs corrupt data
- Without unique constraints, duplicates slip through
- Without grace windows, final requests timeout

The complexity is NECESSARY for correctness.

---

## Contact & Escalation

**If you need to modify a protected invariant:**
1. Document the requirement in a GitHub issue
2. Tag `@runtime-team` for review
3. Discuss alternatives before implementing
4. Ensure all tests updated and passing
5. Get explicit approval before merge

**If a test is blocking your change:**
1. Check RUNTIME_STABILITY_LOCK.md for why the test exists
2. Verify your change doesn't violate the invariant
3. If it does, escalate (don't bypass the test)
4. If it doesn't, test may need update (discuss with team)

---

## Summary

The runtime system is **PROTECTED** because it must handle:
- ✓ Concurrent writes from multiple tabs
- ✓ Network failures and retries
- ✓ Browser refresh and session restore
- ✓ Load under 100+ concurrent users
- ✓ Atomic submission without duplicates

**Respect these protections. They keep the system correct.**

---

**Questions?** See [RUNTIME_STABILITY_LOCK.md](RUNTIME_STABILITY_LOCK.md), [FEATURE_BOUNDARIES.md](FEATURE_BOUNDARIES.md), or [RUNTIME_GUARDRAILS.md](RUNTIME_GUARDRAILS.md).
