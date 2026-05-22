BEGIN PHASE 6 — PRODUCTION UI/UX MODERNIZATION

IMPORTANT:
The runtime architecture is frozen and protected.

DO NOT MODIFY:

* backend concurrency logic
* Prisma constraints
* autosave contracts
* ownership enforcement
* sessionVersion behavior
* submit pipeline
* reconnect semantics

READ FIRST:

* README_RUNTIME_PROTECTION.md
* FEATURE_BOUNDARIES.md
* CRITICAL_SECTIONS_REFERENCE.md

PRIMARY GOAL:
Redesign and modernize ONLY the STUDENT EXAM EXPERIENCE.

DO NOT redesign admin pages.

====================================================
PHASE 6A — STUDENT EXAM EXPERIENCE
==================================

Create a modern production-grade CBT interface comparable to:

* WAEC CBT
* JAMB CBT
* Google Forms
* modern SaaS dashboards

Focus:

* clarity
* responsiveness
* accessibility
* reliability visibility
* smooth UX
* minimal distraction

====================================================

1. EXAM PAGE REDESIGN
   ====================================================

A. Sticky top header:

* exam title
* countdown timer
* autosave status
* reconnect/offline status
* submit button
* progress indicator

B. Question area:

* improved typography
* improved spacing
* improved readability
* larger clickable answer cards
* cleaner focus states
* smooth transitions

C. Question navigator:

* answered/unanswered indicators
* current question highlight
* flagged questions
* sticky sidebar
* collapsible mobile drawer

D. Footer controls:

* previous/next navigation
* keyboard shortcut hints
* save feedback
* question counter

====================================================
2. RELIABILITY VISIBILITY UX
============================

Add visual runtime states:

* autosaving...
* saved
* reconnecting...
* offline mode
* session restored
* recovering session...
* another tab detected
* stale session warning
* submission in progress
* retrying save...

Requirements:

* professional
* subtle
* non-blocking
* smooth animations

====================================================
3. MOBILE RESPONSIVENESS
========================

Optimize for:

* phones
* tablets
* low-width screens

Requirements:

* touch-friendly answer cards
* sticky timer
* responsive typography
* collapsible navigation
* safe viewport handling

====================================================
4. ACCESSIBILITY
================

Add:

* keyboard navigation
* ARIA labels
* focus management
* screen reader support
* reduced-motion support
* high contrast support

Keyboard:

* arrow navigation
* number key selection
* Enter/Space support
* Escape closes drawers

====================================================
5. DESIGN SYSTEM
================

Standardize:

* spacing scale
* typography
* buttons
* cards
* shadows
* radius
* colors
* loading states
* skeletons
* toasts

Create reusable UI primitives.

====================================================
6. PERFORMANCE + UX
===================

Add:

* skeleton loading
* optimistic save feedback
* smooth transitions
* lightweight animations
* memoization
* rerender optimization

DO NOT degrade:

* autosave timing
* synchronization
* restore speed

====================================================
7. SAFE UI RULES
================

UI MAY:

* improve visuals
* improve layout
* improve responsiveness
* improve accessibility
* add animations

UI MUST NOT:

* mutate runtime session state directly
* bypass autosave
* bypass submit flow
* bypass ownership enforcement
* bypass reconnect flow
* alter sessionVersion semantics
* weaken concurrency protection

====================================================
8. VALIDATION
=============

After implementation run:

* npm run build
* npm run lint
* npm run typecheck
* npx playwright test tests-e2e/exam-resilience.spec.ts
* npm test

Verify:

* all resilience tests pass
* runtime unchanged
* no duplicate submissions
* no hydration errors
* no React runtime warnings

====================================================
9. VISUAL TARGET
================

Feel:

* calm
* modern
* trustworthy
* exam-focused
* resilient
* premium but lightweight

Avoid:

* flashy animations
* heavy gradients
* distracting motion
* heavy UI frameworks

====================================================
10. DELIVERABLES
================

Deliver:

* redesigned exam UI
* reusable components
* responsive layouts
* accessibility improvements
* reliability indicators
* loading/skeleton states
* updated styling system
* summary of changes

IMPORTANT:
This phase ONLY modernizes the UX layer.
The protected runtime engine must remain untouched.
