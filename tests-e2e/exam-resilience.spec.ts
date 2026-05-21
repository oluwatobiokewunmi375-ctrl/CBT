import { test, expect } from '@playwright/test'
import { prisma } from '../lib/prisma'

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000'
const TEST_STUDENT_NO = 'STURESIL001'
const TEST_EXAM_ID = 'exam-resilience-001'

test.beforeAll(async () => {
  await createTestFixtures()
})

test.beforeEach(async () => {
  // Clean up any previous submissions for this test run to ensure test isolation
  const student = await prisma.student.findFirst({
    where: { studentNo: TEST_STUDENT_NO },
  })
  
  if (student) {
    await prisma.examSubmission.deleteMany({
      where: {
        studentId: student.id,
        examId: TEST_EXAM_ID,
      },
    })
    
    await prisma.result.deleteMany({
      where: {
        studentId: student.id,
        examId: TEST_EXAM_ID,
      },
    })

    // Reset session status for clean test state
    await prisma.session.updateMany({
      where: {
        studentId: student.id,
        examId: TEST_EXAM_ID,
      },
      data: {
        status: 'ABANDONED',
      },
    })
  }
})

async function createTestFixtures() {
  const school = await prisma.school.upsert({
    where: { shortCode: 'RESIL' },
    create: {
      name: 'Resilience School',
      shortCode: 'RESIL',
    },
    update: {
      name: 'Resilience School',
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'resilience-student@test.com' },
    create: {
      email: 'resilience-student@test.com',
      password: 'test-password',
      fullName: 'Resilience Student',
      role: 'STUDENT',
      schoolId: school.id,
    },
    update: {
      fullName: 'Resilience Student',
      schoolId: school.id,
    },
  })

  await prisma.student.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      schoolId: school.id,
      studentNo: TEST_STUDENT_NO,
    },
    update: {
      studentNo: TEST_STUDENT_NO,
      schoolId: school.id,
    },
  })

  await prisma.exam.upsert({
    where: { id: TEST_EXAM_ID },
    create: {
      id: TEST_EXAM_ID,
      title: 'Resilience Stress Test Exam',
      description: 'Exam used for Playwright resilience validation',
      schoolId: school.id,
      duration: 600,
      totalMarks: 2,
      status: 'PUBLISHED',
      questions: {
        create: [
          {
            content: 'What is 1 + 1?',
            type: 'MULTIPLE_CHOICE',
            marks: 1,
            options: {
              create: [
                { text: '1', isCorrect: false, order: 1 },
                { text: '2', isCorrect: true, order: 2 },
                { text: '3', isCorrect: false, order: 3 },
                { text: '4', isCorrect: false, order: 4 },
              ],
            },
          },
          {
            content: 'What is 2 + 2?',
            type: 'MULTIPLE_CHOICE',
            marks: 1,
            options: {
              create: [
                { text: '2', isCorrect: false, order: 1 },
                { text: '3', isCorrect: false, order: 2 },
                { text: '4', isCorrect: true, order: 3 },
                { text: '5', isCorrect: false, order: 4 },
              ],
            },
          },
        ],
      },
    },
    update: {
      title: 'Resilience Stress Test Exam',
      description: 'Exam used for Playwright resilience validation',
      schoolId: school.id,
      duration: 600,
      totalMarks: 2,
      status: 'PUBLISHED',
    },
  })
}

async function browserFetch(page, url: string, init: RequestInit = {}) {
  const payload = JSON.stringify(init)
  const result = await page.evaluate(async ({ url, payload }) => {
    try {
      const init = JSON.parse(payload)
      const response = await fetch(url, init)
      const text = await response.text()
      let body: any = null
      try {
        body = text ? JSON.parse(text) : null
      } catch {
        body = text
      }
      return {
        status: response.status,
        ok: response.ok,
        body,
      }
    } catch (error) {
      return {
        status: 0,
        ok: false,
        body: { error: error?.message || String(error) },
      }
    }
  }, { url, payload })

  return result as { status: number; ok: boolean; body: any }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function loginExam(page, studentNo: string) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'load' })

  const loginResponse = await page.evaluate(async (studentNo) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentNo }),
    })
    const body = await res.text()

    if (!res.ok) {
      return { ok: false, status: res.status, body }
    }

    return { ok: true, status: res.status, body }
  }, studentNo)

  if (!loginResponse.ok) {
    throw new Error(`Student login failed: ${loginResponse.status} ${loginResponse.body}`)
  }

  await page.evaluate(() => {
    window.location.href = '/exam-list'
  })
  await page.waitForURL(/\/exam-list/, { timeout: 20000 })
}

test.describe('Exam resilience', () => {
  test('owner tab protects save progress and stale save is rejected', async ({ page }) => {
    await loginExam(page, TEST_STUDENT_NO)

    const startButton = page.getByRole('button', { name: /Start Exam/i }).first()
    await expect(startButton).toBeVisible({ timeout: 20000 })
    await Promise.all([
      page.waitForURL(/\/exam\//, { timeout: 20000 }),
      startButton.click(),
    ])

    await page.waitForSelector('text=Time remaining', { timeout: 20000 })
    const examListResp = await browserFetch(page, '/api/exam/list')
    console.log('examListResp', examListResp)
    const examId = page.url().split('/').pop() || ''
    console.log('exam URL', page.url(), 'examId', examId)
    console.log('document.cookie', await page.evaluate(() => document.cookie))
    const ownerTabIdA = await page.evaluate(() => sessionStorage.getItem('cbt_exam_owner_tab_id'))
    expect(ownerTabIdA).toBeTruthy()

    const sessionResp = await browserFetch(page, `/api/exam/start?examId=${examId}`)
    console.log('sessionResp', sessionResp)
    expect(sessionResp.ok).toBeTruthy()
    const sessionData = sessionResp.body
    const sessionId = sessionData?.session?.id
    const initialVersion = sessionData?.session?.version
    expect(sessionId).toBeTruthy()
    expect(typeof initialVersion).toBe('number')

    // Open a second tab in the same browser session and resume the same exam.
    const pageB = await page.context().newPage()
    await pageB.goto(`${baseUrl}/exam/${examId}`, { waitUntil: 'load' })
    await pageB.waitForSelector('text=Time remaining', { timeout: 20000 })
    const ownerTabIdB = await pageB.evaluate(() => sessionStorage.getItem('cbt_exam_owner_tab_id'))
    expect(ownerTabIdB).toBeTruthy()
    expect(ownerTabIdB).not.toBe(ownerTabIdA)

    // Confirm first tab can save progress using its ownerTabId.
    const examDetailResp = await browserFetch(page, `/api/exam/${examId}`)
    const examDetail = examDetailResp.body
    const firstQuestionId = examDetail?.exam?.questions?.[0]?.id
    const firstOptionId = examDetail?.exam?.questions?.[0]?.options?.[0]?.id
    expect(firstQuestionId).toBeTruthy()
    expect(firstOptionId).toBeTruthy()

    const saveA = await browserFetch(page, '/api/exam/save-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        answers: { [firstQuestionId]: firstOptionId },
        currentQuestionId: firstQuestionId,
        clientUpdatedAt: Date.now(),
        sessionVersion: initialVersion,
        ownerTabId: ownerTabIdA,
      }),
    })
    expect(saveA.status).toBe(200)
    const savedSession = saveA.body
    const savedVersion = savedSession?.session?.version
    expect(savedVersion).toBeGreaterThan(initialVersion)

    // Second tab uses stale version and different ownerTabId; should be rejected.
    const saveB = await browserFetch(pageB, '/api/exam/save-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        answers: { [firstQuestionId]: firstOptionId },
        currentQuestionId: firstQuestionId,
        clientUpdatedAt: Date.now(),
        sessionVersion: initialVersion,
        ownerTabId: ownerTabIdB,
      }),
    })

    expect(saveB.status).toBe(409)
    const saveBBody = saveB.body
    expect(saveBBody.error).toMatch(/Session owned by another tab|Stale session version|Session version mismatch/)

    await pageB.close()
  })

  test('refresh restores active session and previous answer selection', async ({ page }) => {
    await loginExam(page, TEST_STUDENT_NO)

    const startButton = page.getByRole('button', { name: /Start Exam/i }).first()
    await Promise.all([
      page.waitForURL(/\/exam\//, { timeout: 20000 }),
      startButton.click(),
    ])

    await page.waitForSelector('text=Time remaining', { timeout: 20000 })

    const firstOption = page.locator('div.space-y-3 button').first()
    await expect(firstOption).toBeVisible({ timeout: 20000 })
    await firstOption.click()
    await page.waitForTimeout(500)

    const examId = page.url().split('/').pop() || ''

    await page.reload({ waitUntil: 'load' })
    await page.waitForSelector('text=Time remaining', { timeout: 20000 })
    await expect(page.locator('text=Question 1 of')).toBeVisible({ timeout: 20000 })

    const sessionResp = await browserFetch(page, `/api/exam/start?examId=${examId}`)
    expect(sessionResp.ok).toBeTruthy()
    const persistedAnswers = sessionResp.body?.session?.answersJson?.answers
    expect(persistedAnswers).toBeTruthy()
    expect(Object.keys(persistedAnswers || {}).length).toBeGreaterThan(0)
  })

  test('parallel submit attempts only create one successful submission', async ({ page }) => {
    await loginExam(page, TEST_STUDENT_NO)

    const startButton = page.getByRole('button', { name: /Start Exam/i }).first()
    await Promise.all([
      page.waitForURL(/\/exam\//, { timeout: 20000 }),
      startButton.click(),
    ])

    await page.waitForSelector('text=Time remaining', { timeout: 20000 })
    const examId = page.url().split('/').pop() || ''

    const sessionResp = await browserFetch(page, `/api/exam/start?examId=${examId}`)
    const sessionData = sessionResp.body
    const sessionId = sessionData?.session?.id
    expect(sessionId).toBeTruthy()

    const examDetailResp = await browserFetch(page, `/api/exam/${examId}`)
    const examDetail = examDetailResp.body
    const answers = {}
    examDetail?.exam?.questions?.forEach((question) => {
      answers[question.id] = question.options?.[0]?.id || ''
    })

    const requestPromises = Array.from({ length: 6 }).map(() =>
      browserFetch(page, '/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          answers,
          timeSpent: 1,
          sessionId,
        }),
      })
    )

    const responses = await Promise.all(requestPromises)
    const successCount = responses.filter((r) => r.status === 201).length
    const conflictCount = responses.filter((r) => r.status === 409).length

    expect(successCount).toBe(1)
    expect(conflictCount).toBeGreaterThanOrEqual(1)

    // Verify DB integrity: exactly one submission and one result
    const submissions = await prisma.examSubmission.findMany({
      where: { studentId: sessionData?.session?.studentId, examId },
    })
    const results = await prisma.result.findMany({
      where: { studentId: sessionData?.session?.studentId, examId },
    })

    expect(submissions).toHaveLength(1)
    expect(results).toHaveLength(1)
  })

  test('concurrent submit from multiple tabs creates only one submission', async ({ context }) => {
    const page1 = await context.newPage()
    const page2 = await context.newPage()

    try {
      // Login on both tabs
      await loginExam(page1, TEST_STUDENT_NO)
      await loginExam(page2, TEST_STUDENT_NO)

      // Start exam on tab 1
      const startButton1 = page1.getByRole('button', { name: /Start Exam/i }).first()
      await Promise.all([
        page1.waitForURL(/\/exam\//, { timeout: 20000 }),
        startButton1.click(),
      ])

      await page1.waitForSelector('text=Time remaining', { timeout: 20000 })
      const examId = page1.url().split('/').pop() || ''

      // Get session from tab 1
      const sessionResp1 = await browserFetch(page1, `/api/exam/start?examId=${examId}`)
      const sessionId = sessionResp1.body?.session?.id
      expect(sessionId).toBeTruthy()

      // Start exam on tab 2 - should get same session
      const startButton2 = page2.getByRole('button', { name: /Start Exam/i }).first()
      await Promise.all([
        page2.waitForURL(/\/exam\//, { timeout: 20000 }),
        startButton2.click(),
      ])

      // Get exam details for answers
      const examDetailResp = await browserFetch(page1, `/api/exam/${examId}`)
      const examDetail = examDetailResp.body
      const answers = {}
      examDetail?.exam?.questions?.forEach((question) => {
        answers[question.id] = question.options?.[0]?.id || ''
      })

      // Submit concurrently from both tabs
      const submitPromises = [
        browserFetch(page1, '/api/exam/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examId,
            answers,
            timeSpent: 1,
            sessionId,
          }),
        }),
        browserFetch(page2, '/api/exam/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examId,
            answers,
            timeSpent: 1,
            sessionId,
          }),
        }),
      ]

      const [resp1, resp2] = await Promise.all(submitPromises)

      // Exactly one should succeed, one should be 409
      const results = [resp1, resp2]
      const successCount = results.filter((r) => r.status === 201).length
      const conflictCount = results.filter((r) => r.status === 409).length

      expect(successCount).toBe(1)
      expect(conflictCount).toBe(1)

      // Verify DB integrity
      const student = await prisma.student.findFirst({
        where: { studentNo: TEST_STUDENT_NO },
      })
      const submissions = await prisma.examSubmission.findMany({
        where: { studentId: student?.id, examId },
      })
      const resultRows = await prisma.result.findMany({
        where: { studentId: student?.id, examId },
      })

      expect(submissions).toHaveLength(1)
      expect(resultRows).toHaveLength(1)
    } finally {
      await page1.close()
      await page2.close()
    }
  })

  test('submit endpoint is idempotent: retry with same data succeeds once', async ({ page }) => {
    await loginExam(page, TEST_STUDENT_NO)

    const startButton = page.getByRole('button', { name: /Start Exam/i }).first()
    await Promise.all([
      page.waitForURL(/\/exam\//, { timeout: 20000 }),
      startButton.click(),
    ])

    await page.waitForSelector('text=Time remaining', { timeout: 20000 })
    const examId = page.url().split('/').pop() || ''

    const sessionResp = await browserFetch(page, `/api/exam/start?examId=${examId}`)
    const sessionId = sessionResp.body?.session?.id

    const examDetailResp = await browserFetch(page, `/api/exam/${examId}`)
    const examDetail = examDetailResp.body
    const answers = {}
    examDetail?.exam?.questions?.forEach((question) => {
      answers[question.id] = question.options?.[0]?.id || ''
    })

    const submitPayload = {
      examId,
      answers,
      timeSpent: 1,
      sessionId,
    }

    // First submit - should succeed
    const resp1 = await browserFetch(page, '/api/exam/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitPayload),
    })
    expect(resp1.status).toBe(201)

    // Retry with exact same payload - should be rejected
    const resp2 = await browserFetch(page, '/api/exam/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitPayload),
    })
    // Should be rejected either as 409 (duplicate) or 400 (session not active)
    expect(resp2.status).toBeGreaterThanOrEqual(400)
    expect(resp2.status).toBeLessThan(500)

    // Verify only one submission exists
    const student = await prisma.student.findFirst({
      where: { studentNo: TEST_STUDENT_NO },
    })
    const submissions = await prisma.examSubmission.findMany({
      where: { studentId: student?.id, examId },
    })
    expect(submissions).toHaveLength(1)
  })

  test('submit with delayed autosave prevents session state corruption', async ({ page }) => {
    await loginExam(page, TEST_STUDENT_NO)

    const startButton = page.getByRole('button', { name: /Start Exam/i }).first()
    await Promise.all([
      page.waitForURL(/\/exam\//, { timeout: 20000 }),
      startButton.click(),
    ])

    await page.waitForSelector('text=Time remaining', { timeout: 20000 })
    const examId = page.url().split('/').pop() || ''

    const sessionResp = await browserFetch(page, `/api/exam/start?examId=${examId}`)
    const sessionId = sessionResp.body?.session?.id
    const ownerTabId = sessionResp.body?.session?.ownerTabId

    const examDetailResp = await browserFetch(page, `/api/exam/${examId}`)
    const examDetail = examDetailResp.body
    const answers = {}
    examDetail?.exam?.questions?.forEach((question) => {
      answers[question.id] = question.options?.[0]?.id || ''
    })

    // Submit exam
    const submitResp = await browserFetch(page, '/api/exam/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        examId,
        answers,
        timeSpent: 1,
        sessionId,
        ownerTabId,
      }),
    })
    expect(submitResp.status).toBe(201)

    // Try autosave after submit - should fail
    const autosaveResp = await browserFetch(page, '/api/exam/save-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        examId,
        sessionId,
        answers,
        currentQuestion: 0,
        ownerTabId,
      }),
    })

    // Autosave should be rejected because session is COMPLETED
    expect(autosaveResp.status).toBeGreaterThanOrEqual(400)

    // Verify session is COMPLETED
    const finalSession = await prisma.session.findUnique({
      where: { id: sessionId },
    })
    expect(finalSession?.status).toBe('COMPLETED')
  })

  // ============================================================================
  // PHASE 2: MULTI-TAB TAKEOVER STRESS
  // ============================================================================

  test('multi-tab rapid switching enforces ownerTabId correctly', async ({ context }) => {
    const tab1 = await context.newPage()
    const tab2 = await context.newPage()

    try {
      // Login on both tabs
      await loginExam(tab1, TEST_STUDENT_NO)
      await loginExam(tab2, TEST_STUDENT_NO)

      // Start exam on tab 1
      const startBtn1 = tab1.getByRole('button', { name: /Start Exam/i }).first()
      await Promise.all([
        tab1.waitForURL(/\/exam\//, { timeout: 20000 }),
        startBtn1.click(),
      ])

      await tab1.waitForSelector('text=Time remaining', { timeout: 20000 })
      const examId = tab1.url().split('/').pop() || ''

      // Get session from tab 1
      const sessionResp1 = await browserFetch(tab1, `/api/exam/start?examId=${examId}`)
      const sessionId = sessionResp1.body?.session?.id
      const currentOwnerTabId = sessionResp1.body?.session?.ownerTabId
      const currentVersion = sessionResp1.body?.session?.version

      expect(sessionId).toBeTruthy()
      expect(currentOwnerTabId).toBeTruthy()
      expect(typeof currentVersion).toBe('number')

      // Get exam details
      const examDetailResp = await browserFetch(tab1, `/api/exam/${examId}`)
      const examDetail = examDetailResp.body
      const answers = {}
      examDetail?.exam?.questions?.forEach((question) => {
        answers[question.id] = question.options?.[0]?.id || ''
      })

      // Tab 2 attempts rapid saves with its own ownerTabId (simulating tab switch)
      const tab2OwnerTabId = 'tab-2-owner-id'
      const saves = []
      for (let i = 0; i < 5; i++) {
        saves.push(
          browserFetch(tab2, '/api/exam/save-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              examId,
              sessionId,
              answers,
              currentQuestion: 0,
              clientUpdatedAt: Date.now(),
              sessionVersion: currentVersion,
              ownerTabId: tab2OwnerTabId,
            }),
          })
        )
      }

      const saveResponses = await Promise.all(saves)
      const rejectedCount = saveResponses.filter((r) => r.status !== 200 && r.status !== 201).length
      expect(rejectedCount).toBe(5)
      expect(saveResponses.every((r) => r.status === 409)).toBeTruthy()

      // Tab 1 should still be able to save (it owns the session)
      const tab1SaveResp = await browserFetch(tab1, '/api/exam/save-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          sessionId,
          answers,
          currentQuestion: 0,
          clientUpdatedAt: Date.now(),
          sessionVersion: currentVersion,
          ownerTabId: currentOwnerTabId,
        }),
      })
      expect(tab1SaveResp?.status).toBeDefined()
      expect([200, 201]).toContain(tab1SaveResp?.status)

      // Verify session version incremented and owner remained consistent
      const finalSession = await prisma.session.findUnique({
        where: { id: sessionId },
      })
      expect(finalSession?.ownerTabId).toBe(currentOwnerTabId)
      expect(finalSession?.version).toBe(currentVersion + 1)
      expect(finalSession?.ownerHeartbeatAt?.getTime()).toBeGreaterThan(Date.now() - 60000)
    } finally {
      await tab1.close()
      await tab2.close()
    }
  })

  test('tab takeover after refresh remains deterministic and active owner is preserved', async ({ context }) => {
    const tabA = await context.newPage()
    const tabB = await context.newPage()

    try {
      await loginExam(tabA, TEST_STUDENT_NO)
      await loginExam(tabB, TEST_STUDENT_NO)

      const startBtnA = tabA.getByRole('button', { name: /Start Exam/i }).first()
      await Promise.all([
        tabA.waitForURL(/\/exam\//, { timeout: 20000 }),
        startBtnA.click(),
      ])
      await tabA.waitForSelector('text=Time remaining', { timeout: 20000 })
      const examId = tabA.url().split('/').pop() || ''

      const sessionRespA = await browserFetch(tabA, `/api/exam/start?examId=${examId}`)
      const sessionId = sessionRespA.body?.session?.id
      const ownerTabIdA = sessionRespA.body?.session?.ownerTabId
      const sessionVersionA = sessionRespA.body?.session?.version

      expect(sessionId).toBeTruthy()
      expect(ownerTabIdA).toBeTruthy()
      expect(typeof sessionVersionA).toBe('number')

      await tabB.goto(`${baseUrl}/exam/${examId}`, { waitUntil: 'load' })
      await tabB.waitForSelector('text=Time remaining', { timeout: 20000 })
      const ownerTabIdB = await tabB.evaluate(() => sessionStorage.getItem('cbt_exam_owner_tab_id'))
      expect(ownerTabIdB).toBeTruthy()
      expect(ownerTabIdB).not.toBe(ownerTabIdA)

      await tabA.reload({ waitUntil: 'load' })
      await tabA.waitForSelector('text=Time remaining', { timeout: 20000 })

      // Secondary tab tries takeover during refresh; should still be rejected while owner heartbeat is fresh.
      const examDetailResp = await browserFetch(tabA, `/api/exam/${examId}`)
      const examDetail = examDetailResp.body
      const answers = {}
      examDetail?.exam?.questions?.forEach((question) => {
        answers[question.id] = question.options?.[0]?.id || ''
      })

      const takeoverResp = await browserFetch(tabB, '/api/exam/save-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          sessionId,
          answers,
          currentQuestion: 0,
          clientUpdatedAt: Date.now(),
          sessionVersion: sessionVersionA,
          ownerTabId: ownerTabIdB,
        }),
      })

      expect(takeoverResp.status).toBe(409)
      expect(takeoverResp.body?.error).toMatch(/Session owned by another tab/)

      const finalSession = await prisma.session.findUnique({ where: { id: sessionId } })
      expect(finalSession?.ownerTabId).toBe(ownerTabIdA)
      expect(finalSession?.version).toBeGreaterThanOrEqual(sessionVersionA)
    } finally {
      await tabA.close()
      await tabB.close()
    }
  })

  test('heartbeat loss recovery allows takeover only after timeout', async ({ context }) => {
    const tabA = await context.newPage()
    const tabB = await context.newPage()

    try {
      await loginExam(tabA, TEST_STUDENT_NO)
      await loginExam(tabB, TEST_STUDENT_NO)

      const startBtnA = tabA.getByRole('button', { name: /Start Exam/i }).first()
      await Promise.all([
        tabA.waitForURL(/\/exam\//, { timeout: 20000 }),
        startBtnA.click(),
      ])
      await tabA.waitForSelector('text=Time remaining', { timeout: 20000 })
      const examId = tabA.url().split('/').pop() || ''

      const sessionRespA = await browserFetch(tabA, `/api/exam/start?examId=${examId}`)
      const sessionId = sessionRespA.body?.session?.id
      const ownerTabIdA = sessionRespA.body?.session?.ownerTabId
      const sessionVersionA = sessionRespA.body?.session?.version

      await tabB.goto(`${baseUrl}/exam/${examId}`, { waitUntil: 'load' })
      await tabB.waitForSelector('text=Time remaining', { timeout: 20000 })
      const ownerTabIdB = await tabB.evaluate(() => sessionStorage.getItem('cbt_exam_owner_tab_id'))

      expect(sessionId).toBeTruthy()
      expect(ownerTabIdA).toBeTruthy()
      expect(ownerTabIdB).toBeTruthy()
      expect(ownerTabIdB).not.toBe(ownerTabIdA)

      // Force heartbeat to be stale so tab B can recover ownership
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          ownerHeartbeatAt: new Date(Date.now() - 60 * 1000),
        },
      })

      const examDetailResp = await browserFetch(tabB, `/api/exam/${examId}`)
      const examDetail = examDetailResp.body
      const answers = {}
      examDetail?.exam?.questions?.forEach((question) => {
        answers[question.id] = question.options?.[0]?.id || ''
      })

      const takeoverResp = await browserFetch(tabB, '/api/exam/save-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          sessionId,
          answers,
          currentQuestion: 0,
          clientUpdatedAt: Date.now(),
          sessionVersion: sessionVersionA,
          ownerTabId: ownerTabIdB,
        }),
      })

      expect([200, 201]).toContain(takeoverResp.status)

      const takeoverSession = await prisma.session.findUnique({ where: { id: sessionId } })
      expect(takeoverSession?.ownerTabId).toBe(ownerTabIdB)
      expect(takeoverSession?.version).toBe(sessionVersionA + 1)

      const staleOwnerResp = await browserFetch(tabA, '/api/exam/save-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          sessionId,
          answers,
          currentQuestion: 0,
          clientUpdatedAt: Date.now(),
          sessionVersion: takeoverSession?.version,
          ownerTabId: ownerTabIdA,
        }),
      })

      expect(staleOwnerResp.status).toBe(409)
      expect(staleOwnerResp.body?.error).toMatch(/Session owned by another tab/)
    } finally {
      await tabA.close()
      await tabB.close()
    }
  })

  test('stale tab submit attempt rejected with ownership enforcement', async ({ context }) => {
    const tab1 = await context.newPage()
    const tab2 = await context.newPage()

    try {
      // Login on both tabs
      await loginExam(tab1, TEST_STUDENT_NO)
      await loginExam(tab2, TEST_STUDENT_NO)

      // Start exam on tab 1
      const startBtn1 = tab1.getByRole('button', { name: /Start Exam/i }).first()
      await Promise.all([
        tab1.waitForURL(/\/exam\//, { timeout: 20000 }),
        startBtn1.click(),
      ])

      await tab1.waitForSelector('text=Time remaining', { timeout: 20000 })
      const examId = tab1.url().split('/').pop() || ''

      // Get session from tab 1
      const sessionResp1 = await browserFetch(tab1, `/api/exam/start?examId=${examId}`)
      const sessionId = sessionResp1.body?.session?.id
      const ownerTabId = sessionResp1.body?.session?.ownerTabId

      // Get exam details
      const examDetailResp = await browserFetch(tab1, `/api/exam/${examId}`)
      const examDetail = examDetailResp.body
      const answers = {}
      examDetail?.exam?.questions?.forEach((question) => {
        answers[question.id] = question.options?.[0]?.id || ''
      })

      // Tab 2 attempts to submit with wrong ownerTabId (stale tab)
      const staleTabOwnerTabId = 'stale-tab-owner-id'
      const staleSubmitResp = await browserFetch(tab2, '/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          answers,
          timeSpent: 1,
          sessionId,
          ownerTabId: staleTabOwnerTabId,
        }),
      })

      // Stale tab submit should be rejected (409 or 400 due to ownership)
      expect(staleSubmitResp.status).toBeGreaterThanOrEqual(400)

      // Tab 1 (true owner) should be able to submit
      const validSubmitResp = await browserFetch(tab1, '/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId,
          answers,
          timeSpent: 1,
          sessionId,
          ownerTabId,
        }),
      })
      expect(validSubmitResp.status).toBe(201)

      // Verify only one submission exists
      const student = await prisma.student.findFirst({
        where: { studentNo: TEST_STUDENT_NO },
      })
      const submissions = await prisma.examSubmission.findMany({
        where: { studentId: student?.id, examId },
      })
      expect(submissions).toHaveLength(1)
    } finally {
      await tab1.close()
      await tab2.close()
    }
  })

  // ============================================================================
  // PHASE 3: RECONNECT + NETWORK INSTABILITY RESILIENCE
  // ============================================================================

  test('offline autosave recovers safely after reconnect and preserves session state', async ({ page }) => {
    await loginExam(page, TEST_STUDENT_NO)

    const startButton = page.getByRole('button', { name: /Start Exam/i }).first()
    await Promise.all([
      page.waitForURL(/\/exam\//, { timeout: 20000 }),
      startButton.click(),
    ])

    await page.waitForSelector('text=Time remaining', { timeout: 20000 })
    const examId = page.url().split('/').pop() || ''

    const sessionResp = await browserFetch(page, `/api/exam/start?examId=${examId}`)
    const sessionId = sessionResp.body?.session?.id
    const ownerTabId = sessionResp.body?.session?.ownerTabId
    const currentVersion = sessionResp.body?.session?.version
    const expiresAtBefore = new Date(sessionResp.body?.session?.expiresAt)

    const examDetailResp = await browserFetch(page, `/api/exam/${examId}`)
    const examDetail = examDetailResp.body
    const answers = {}
    const firstQuestionId = examDetail?.exam?.questions?.[0]?.id
    const firstOptionId = examDetail?.exam?.questions?.[0]?.options?.[0]?.id
    answers[firstQuestionId] = firstOptionId

    const saveResp = await browserFetch(page, '/api/exam/save-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        answers,
        currentQuestionId: firstQuestionId,
        clientUpdatedAt: Date.now(),
        sessionVersion: currentVersion,
        ownerTabId,
      }),
    })
    expect(saveResp.status).toBe(200)
    const updatedVersion = saveResp.body?.session?.version
    expect(updatedVersion).toBe(currentVersion + 1)

    await page.context().setOffline(true)
    const offlineSaveResp = await browserFetch(page, '/api/exam/save-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        answers,
        currentQuestionId: firstQuestionId,
        clientUpdatedAt: Date.now(),
        sessionVersion: updatedVersion,
        ownerTabId,
      }),
    })
    expect(offlineSaveResp.status).toBe(0)
    expect(offlineSaveResp.ok).toBe(false)

    await page.context().setOffline(false)
    const reconnectSaveResp = await browserFetch(page, '/api/exam/save-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        answers,
        currentQuestionId: firstQuestionId,
        clientUpdatedAt: Date.now(),
        sessionVersion: updatedVersion,
        ownerTabId,
      }),
    })
    expect(reconnectSaveResp.status).toBe(200)

    const finalSession = await prisma.session.findUnique({ where: { id: sessionId } })
    expect(finalSession?.answersJson?.answers?.[firstQuestionId]).toBe(firstOptionId)
    expect(finalSession?.version).toBe(updatedVersion + 1)
    expect(new Date(finalSession?.expiresAt).getTime()).toBeGreaterThanOrEqual(expiresAtBefore.getTime())
    expect(Math.abs(new Date(finalSession?.expiresAt).getTime() - expiresAtBefore.getTime())).toBeLessThan(1000)

    const student = await prisma.student.findFirst({ where: { studentNo: TEST_STUDENT_NO } })
    const submissions = await prisma.examSubmission.findMany({
      where: { studentId: student?.id, examId },
    })
    expect(submissions).toHaveLength(0)
  })

  test('delayed save payload replay is rejected and latest state is preserved', async ({ page }) => {
    await loginExam(page, TEST_STUDENT_NO)

    const startButton = page.getByRole('button', { name: /Start Exam/i }).first()
    await Promise.all([
      page.waitForURL(/\/exam\//, { timeout: 20000 }),
      startButton.click(),
    ])

    await page.waitForSelector('text=Time remaining', { timeout: 20000 })
    const examId = page.url().split('/').pop() || ''

    const sessionResp = await browserFetch(page, `/api/exam/start?examId=${examId}`)
    const sessionId = sessionResp.body?.session?.id
    const ownerTabId = sessionResp.body?.session?.ownerTabId
    const version1 = sessionResp.body?.session?.version

    const examDetailResp = await browserFetch(page, `/api/exam/${examId}`)
    const examDetail = examDetailResp.body
    const answersA = {}
    const answersB = {}
    const firstQuestionId = examDetail?.exam?.questions?.[0]?.id
    answersA[firstQuestionId] = examDetail?.exam?.questions?.[0]?.options?.[0]?.id || ''
    answersB[firstQuestionId] = examDetail?.exam?.questions?.[0]?.options?.[1]?.id || ''

    const validSaveResp = await browserFetch(page, '/api/exam/save-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        answers: answersA,
        currentQuestionId: firstQuestionId,
        clientUpdatedAt: Date.now(),
        sessionVersion: version1,
        ownerTabId,
      }),
    })
    expect(validSaveResp.status).toBe(200)
    const version2 = validSaveResp.body?.session?.version

    const newerSaveResp = await browserFetch(page, '/api/exam/save-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        answers: answersB,
        currentQuestionId: firstQuestionId,
        clientUpdatedAt: Date.now() + 1000,
        sessionVersion: version2,
        ownerTabId,
      }),
    })
    expect(newerSaveResp.status).toBe(200)
    const version3 = newerSaveResp.body?.session?.version

    const staleReplayResp = await browserFetch(page, '/api/exam/save-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        answers: answersA,
        currentQuestionId: firstQuestionId,
        clientUpdatedAt: Date.now() - 10000,
        sessionVersion: version1,
        ownerTabId,
      }),
    })
    expect(staleReplayResp.status).toBe(409)
    expect(staleReplayResp.body?.error).toMatch(/Stale session version|Session version mismatch|Stale save ignored/)

    const finalSession = await prisma.session.findUnique({ where: { id: sessionId } })
    expect(finalSession?.answersJson?.answers?.[firstQuestionId]).toBe(answersB[firstQuestionId])
    expect(finalSession?.version).toBe(version3)
    expect(finalSession?.version).toBeGreaterThan(version2)
  })

  test('refresh during network loss restores active session and authoritative timer on reconnect', async ({ page }) => {
    await loginExam(page, TEST_STUDENT_NO)

    const startButton = page.getByRole('button', { name: /Start Exam/i }).first()
    await Promise.all([
      page.waitForURL(/\/exam\//, { timeout: 20000 }),
      startButton.click(),
    ])

    await page.waitForSelector('text=Time remaining', { timeout: 20000 })
    const examId = page.url().split('/').pop() || ''

    const sessionResp = await browserFetch(page, `/api/exam/start?examId=${examId}`)
    const sessionId = sessionResp.body?.session?.id
    const ownerTabId = sessionResp.body?.session?.ownerTabId
    const initialExpiresAt = new Date(sessionResp.body?.session?.expiresAt)
    const initialVersion = sessionResp.body?.session?.version

    const examDetailResp = await browserFetch(page, `/api/exam/${examId}`)
    const examDetail = examDetailResp.body
    const answers = {}
    const firstQuestionId = examDetail?.exam?.questions?.[0]?.id
    const firstOptionId = examDetail?.exam?.questions?.[0]?.options?.[0]?.id
    answers[firstQuestionId] = firstOptionId

    const saveResp = await browserFetch(page, '/api/exam/save-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        answers,
        currentQuestionId: firstQuestionId,
        clientUpdatedAt: Date.now(),
        sessionVersion: initialVersion,
        ownerTabId,
      }),
    })
    expect(saveResp.status).toBe(200)

    await page.context().setOffline(true)
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {})
    await page.context().setOffline(false)

    await page.goto(`${baseUrl}/exam/${examId}`, { waitUntil: 'networkidle', timeout: 20000 })
    await page.waitForSelector('text=Time remaining', { timeout: 20000 })

    const resumeSessionResp = await browserFetch(page, `/api/exam/start?examId=${examId}`)
    expect(resumeSessionResp.ok).toBeTruthy()
    expect(resumeSessionResp.body?.session?.id).toBe(sessionId)
    expect(new Date(resumeSessionResp.body?.session?.expiresAt).getTime()).toBe(initialExpiresAt.getTime())
    expect(resumeSessionResp.body?.session?.answersJson?.answers?.[firstQuestionId]).toBe(firstOptionId)
  })

  test('reconnect near expiration respects server authoritative expiry and rejects expired session', async ({ page }) => {
    await loginExam(page, TEST_STUDENT_NO)

    const startButton = page.getByRole('button', { name: /Start Exam/i }).first()
    await Promise.all([
      page.waitForURL(/\/exam\//, { timeout: 20000 }),
      startButton.click(),
    ])

    await page.waitForSelector('text=Time remaining', { timeout: 20000 })
    const examId = page.url().split('/').pop() || ''

    const sessionResp = await browserFetch(page, `/api/exam/start?examId=${examId}`)
    const sessionId = sessionResp.body?.session?.id
    const ownerTabId = sessionResp.body?.session?.ownerTabId

    const expiresAt = new Date(Date.now() + 5000)
    await prisma.session.update({ where: { id: sessionId }, data: { expiresAt } })

    await page.context().setOffline(true)
    await sleep(6000)
    await page.context().setOffline(false)

    const expiredSaveResp = await browserFetch(page, '/api/exam/save-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        answers: {},
        currentQuestionId: null,
        clientUpdatedAt: Date.now(),
        sessionVersion: sessionResp.body?.session?.version,
        ownerTabId,
      }),
    })
    expect(expiredSaveResp.status).toBeGreaterThanOrEqual(400)
    expect(expiredSaveResp.body?.error).toMatch(/Session has expired/)

    const expiredSession = await prisma.session.findUnique({ where: { id: sessionId } })
    expect(expiredSession?.status).toBe('EXPIRED')
    expect(new Date(expiredSession?.expiresAt).getTime()).toBe(expiresAt.getTime())
  })

  test('retrying submit after intermittent failure creates only one submission and preserves transaction integrity', async ({ page }) => {
    await loginExam(page, TEST_STUDENT_NO)

    const startButton = page.getByRole('button', { name: /Start Exam/i }).first()
    await Promise.all([
      page.waitForURL(/\/exam\//, { timeout: 20000 }),
      startButton.click(),
    ])

    await page.waitForSelector('text=Time remaining', { timeout: 20000 })
    const examId = page.url().split('/').pop() || ''

    const sessionResp = await browserFetch(page, `/api/exam/start?examId=${examId}`)
    const sessionId = sessionResp.body?.session?.id

    const examDetailResp = await browserFetch(page, `/api/exam/${examId}`)
    const examDetail = examDetailResp.body
    const answers = {}
    examDetail?.exam?.questions?.forEach((question) => {
      answers[question.id] = question.options?.[0]?.id || ''
    })

    const submitPayload = {
      examId,
      answers,
      timeSpent: 1,
      sessionId,
    }

    const firstSubmitResp = await browserFetch(page, '/api/exam/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitPayload),
    })
    expect([200, 201, 409]).toContain(firstSubmitResp.status)

    const retrySubmitResp = await browserFetch(page, '/api/exam/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitPayload),
    })
    expect(retrySubmitResp.status).toBeGreaterThanOrEqual(400)
    expect(retrySubmitResp.status).toBeLessThan(500)

    const student = await prisma.student.findFirst({ where: { studentNo: TEST_STUDENT_NO } })
    const submissions = await prisma.examSubmission.findMany({ where: { studentId: student?.id, examId } })
    const results = await prisma.result.findMany({ where: { studentId: student?.id, examId } })
    expect(submissions).toHaveLength(1)
    expect(results).toHaveLength(1)
  })

  test('session restoration works after a fresh context reconnect, simulating server restart recovery', async ({ page, context }) => {
    await loginExam(page, TEST_STUDENT_NO)

    const startButton = page.getByRole('button', { name: /Start Exam/i }).first()
    await Promise.all([
      page.waitForURL(/\/exam\//, { timeout: 20000 }),
      startButton.click(),
    ])

    await page.waitForSelector('text=Time remaining', { timeout: 20000 })
    const examId = page.url().split('/').pop() || ''
    const sessionResp = await browserFetch(page, `/api/exam/start?examId=${examId}`)
    const sessionId = sessionResp.body?.session?.id
    const ownerTabId = sessionResp.body?.session?.ownerTabId

    const storageState = await context.storageState()
    const newContext = await context.browser().newContext({ storageState })
    const newPage = await newContext.newPage()

    await newPage.goto(`${baseUrl}/exam/${examId}`, { waitUntil: 'networkidle', timeout: 20000 })
    await newPage.waitForSelector('text=Time remaining', { timeout: 20000 })

    const resumedSessionResp = await browserFetch(newPage, `/api/exam/start?examId=${examId}`)
    expect(resumedSessionResp.ok).toBeTruthy()
    expect(resumedSessionResp.body?.session?.id).toBe(sessionId)
    expect(resumedSessionResp.body?.session?.ownerTabId).toBe(ownerTabId)

    await newPage.close()
    await newContext.close()
  })
})
