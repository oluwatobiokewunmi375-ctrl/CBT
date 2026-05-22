# CBT Runtime Feature Boundaries

**Status**: ENFORCED - UI layer constraints defined and protected
**Version**: 1.0
**Scope**: All UI/UX work must respect these boundaries

---

## Overview

This document defines the strict feature boundaries between the UI layer and the protected runtime system. These boundaries MUST be enforced in code review to prevent UI work from destabilizing the validated concurrency architecture.

---

## The Protected Runtime Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  UI LAYER (Can Change)                       │
│  - React components, styling, layout, animations, UX flows   │
│  - Redux/Zustand local state (UI state only)                │
│  - Error messaging, polling, retries                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
             ╔═════════════════════╗ (Fixed API Contracts)
             ║  API Boundary       ║
             ╚═════════════════════╝
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              PROTECTED RUNTIME (Frozen)                      │
│  - Session version management (optimistic concurrency)       │
│  - Ownership enforcement (ownerTabId, heartbeat)             │
│  - Submission deduplication (unique constraints)             │
│  - Expiry validation (grace window)                          │
│  - Atomic transactions                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Strict Boundaries

### 1. Session State Management

#### ❌ UI **CANNOT**:
- Directly mutate `session.version` or read it to decide behavior
- Modify `session.ownerTabId` or `session.ownerHeartbeatAt`
- Alter `session.expiresAt` or compute expiry logic
- Store session state in Redux/Zustand (Redux state is UI-local only)
- Bypass autosave to directly write to `session.answersJson`

**Why**: Version atomicity, ownership enforcement, and expiry validation must be server-authoritative.

#### ✅ UI **CAN**:
- Display session metadata (time remaining, current question, etc.) from Redux
- Show "offline" indicator if API calls fail
- Display "tab ownership lost" message on 403/409 errors
- Poll session health via dedicated health-check endpoint (read-only)

#### Implementation Example:
```typescript
// ❌ WRONG: Mutating session version
const session = await fetch(`/api/exam/session/${sessionId}`);
session.data.version += 1; // FORBIDDEN

// ✅ RIGHT: Let API route handle version
const result = await fetch(`/api/exam/save-progress`, {
  body: JSON.stringify({ sessionId, answers, sessionVersion })
});
// API returns 409 if version conflict; UI retries
```

---

### 2. Autosave Pipeline

#### ❌ UI **CANNOT**:
- Skip autosave and submit directly
- Modify autosave frequency without consulting runtime team
- Bypass ownership check in save-progress
- Cache autosave results across browser restarts
- Treat 409 conflicts as errors (they're expected and safe)

**Why**: Every answer change must go through the version-controlled autosave pipeline.

#### ✅ UI **CAN**:
- Debounce autosave (backend idempotency handles duplicates)
- Show autosave status (spinner, checkmark, error)
- Implement client-side answer validation (before autosave)
- Queue autosaves during offline; retry on reconnect
- Show "autosave paused - tab ownership lost" message

#### Implementation Example:
```typescript
// ❌ WRONG: Skipping autosave
if (isLastQuestion) {
  await submitDirectly(); // FORBIDDEN
}

// ✅ RIGHT: Always autosave first
async function handleAnswerChange(qId, answer) {
  updateLocalState(qId, answer); // UI state only
  await autosave(); // Always goes through save-progress
}
```

---

### 3. Submit Pipeline

#### ❌ UI **CANNOT**:
- Directly write to ExamSubmission or Result tables
- Bypass the /api/exam/submit route
- Allow submit if session is expired (even with grace window)
- Retry submit on duplicate error (idempotency is automatic)
- Modify submission data after creation

**Why**: Duplicate prevention and atomic scoring require transaction semantics.

#### ✅ UI **CAN**:
- Show "submit in progress" spinner
- Disable submit button during processing
- Show final score/grade once returned from API
- Handle 409 duplicate error gracefully (show existing score)
- Provide "Exam submitted successfully" confirmation

#### Implementation Example:
```typescript
// ❌ WRONG: Direct database write
await prisma.examSubmission.create({
  data: { studentId, examId, ... }
});

// ✅ RIGHT: Use API route
const response = await fetch(`/api/exam/submit`, {
  method: "POST",
  body: JSON.stringify({ examId, answers, timeSpent, sessionId })
});
// API enforces duplicate prevention and atomicity
```

---

### 4. Ownership Enforcement

#### ❌ UI **CANNOT**:
- Ignore 403 or 409 ownership errors
- Allow non-owner tab to save/submit
- Modify `ownerTabId` or heartbeat timestamp
- Assume single-tab access
- Continue exam in stale tab after ownership transfer

**Why**: Multi-tab ownership prevents data corruption from concurrent writes.

#### ✅ UI **CAN**:
- Display "This exam is open in another tab" message on ownership loss
- Show timer indicating when ownership can be reclaimed
- Suggest "Refresh page to regain control" after grace window
- Implement heartbeat ping to maintain ownership (in React hook)
- Gracefully show "exam paused in this tab" UI state

#### Implementation Example:
```typescript
// ❌ WRONG: Ignoring ownership error
const resp = await saveProgress();
if (resp.status === 409) {
  retryAgain(); // FORBIDDEN - may belong to other tab
}

// ✅ RIGHT: Check ownership in error
const resp = await saveProgress();
if (resp.status === 409) {
  if (resp.body.error.includes("owned by another tab")) {
    showAlert("Exam open in another tab. Refresh to regain control.");
    pauseUI();
  } else {
    // Version conflict - safe to retry
    exponentialBackoffRetry();
  }
}
```

---

### 5. Restore & Reconnect Flow

#### ❌ UI **CANNOT**:
- Auto-resume expired sessions without validation
- Skip restore endpoint on page refresh
- Assume session exists without validation
- Restore session from localStorage without server check
- Allow resume after nominal expiry + grace window

**Why**: Expiry validation and ownership transfer must be server-authoritative.

#### ✅ UI **CAN**:
- Show "Exam loading" spinner while restoring
- Display "Session expired" message if restore returns 401
- Implement "Click to continue exam" button for grace window
- Store sessionId in localStorage (read-only)
- Show "Welcome back! Your progress was saved" message

#### Implementation Example:
```typescript
// ❌ WRONG: Resuming from localStorage without validation
const sessionId = localStorage.getItem("sessionId");
if (sessionId) {
  setExamState(loadedExamState); // FORBIDDEN - may be expired
}

// ✅ RIGHT: Validate via restore endpoint
const sessionId = localStorage.getItem("sessionId");
if (sessionId) {
  const resp = await fetch(`/api/exam/restore`, {
    method: "POST",
    body: JSON.stringify({ sessionId, ownerTabId })
  });
  if (resp.status === 200) {
    setExamState(resp.data.session); // Server validates and returns
  } else {
    showExpiredMessage();
  }
}
```

---

### 6. Offline & Recovery Behavior

#### ❌ UI **CANNOT**:
- Submit answers while offline
- Assume cached session state is valid after long offline periods
- Lose queued autosaves on page refresh
- Show stale answers after network recovery

**Why**: Network transitions require server validation of session state.

#### ✅ UI **CAN**:
- Queue autosaves in IndexedDB while offline
- Show "offline" indicator in UI
- Display "Syncing..." message while retry-queued saves are processing
- Request user to go online before submit
- Show "Connection restored - resuming exam" message on recovery

#### Implementation Example:
```typescript
// ❌ WRONG: Accepting answers while offline
if (isOnline) {
  autosave();
}
// Answer accepted either way - data loss on page refresh

// ✅ RIGHT: Queue offline, sync on reconnect
if (isOnline) {
  autosave();
} else {
  queueOfflineAutosave(); // Stored in IndexedDB
  showOfflineIndicator();
}

window.addEventListener("online", async () => {
  await syncOfflineQueue();
  hideOfflineIndicator();
});
```

---

## Forbidden Architectural Regressions

### DO NOT:

| Change | Impact | Why Forbidden |
|--------|--------|--------------|
| Remove `@@unique([studentId, examId])` from ExamSubmission | Allows duplicate submissions | Core invariant |
| Remove `@@unique([studentId, examId])` from Result | Allows duplicate scoring | Core invariant |
| Change Session.version semantics | Breaks optimistic concurrency | Core invariant |
| Bypass ownership check in save-progress or submit | Multi-tab data corruption | Core invariant |
| Alter expiresAt grace window (10s) | Breaks submit/save boundary | Core invariant |
| Modify ownerHeartbeatAt timeout (30s) | Breaks ownership transfer | Core invariant |
| Skip transaction atomicity in submit | Partial results possible | Core invariant |
| Store session version in Redux | Causes stale write conflicts | Core invariant |
| Auto-resume expired sessions | Violates expiry semantics | Core invariant |
| Add new session fields without DB backing | Inconsistent state | Core invariant |

---

## Code Review Checklist for UI PRs

Before approving any UI change, ensure:

- [ ] No new imports from `@prisma/client` or database schema
- [ ] No direct modification of `version`, `ownerTabId`, `ownerHeartbeatAt`, `expiresAt`
- [ ] All answer changes go through save-progress API
- [ ] 409 conflicts handled gracefully (not treated as errors)
- [ ] Ownership 403 errors show appropriate UI messages
- [ ] Session state changes only via API responses
- [ ] No localStorage session caching (sessionId only)
- [ ] Offline queue uses IndexedDB, not memory
- [ ] Heartbeat polling implemented if multi-tab support added
- [ ] Tests pass: `npm run test:all`

---

## Safe UI Extension Points

These areas **CAN** be modified without runtime risk:

### Display & Layout
- Question card styling and layout
- Timer display format and positioning
- Progress bar visualization
- Navigation structure and styling
- Color scheme, fonts, spacing

### UX Improvements
- Enhanced error messaging (with proper conflict understanding)
- Autosave feedback (spinner, checkmark, timing)
- Improved keyboard navigation
- Better accessibility (ARIA, keyboard shortcuts)
- Loading states and transitions

### Client-Side Logic
- Redux/Zustand for UI state management (answers, current Q, etc.)
- Client-side form validation (before autosave)
- Debouncing and throttling (backend is idempotent)
- Animation and microinteractions
- Polling interval for UI refresh (doesn't affect API)

### Analytics & Observability
- Event tracking for user actions
- Error logging and monitoring
- Performance metrics
- User session analytics
- A/B testing (UI variants)

### Offline Features
- Offline indicator UI
- Queued save indicator
- Sync progress display
- Reconnection messaging

---

## Summary

**The runtime is FROZEN and PROTECTED.**

UI layer work must:
1. ✅ Use only the public API contracts
2. ✅ Respect 409 conflicts as expected and safe
3. ✅ Validate ownership/expiry before showing UI
4. ✅ Never mutate server-authoritative state locally
5. ✅ Always autosave before submit
6. ✅ Queue and retry intelligently (with backoff)

UI layer must NOT:
1. ❌ Modify session version, ownerTabId, expiresAt
2. ❌ Bypass autosave or submit pipelines
3. ❌ Treat 409 as failure
4. ❌ Store session state outside API responses
5. ❌ Allow non-owner tabs to persist answers
6. ❌ Auto-resume expired sessions

---

## Escalation

If UI requirements conflict with these boundaries, escalate to the runtime team BEFORE implementing. Do not modify protected invariants.
