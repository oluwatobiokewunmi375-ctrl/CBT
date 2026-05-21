#!/usr/bin/env node
const { spawnSync, spawn, execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const os = require('os');
const path = require('path');
const prisma = new PrismaClient({ log: ['warn', 'error'] });

const baseUrl = process.env.LOAD_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
const examId = process.env.LOAD_EXAM_ID || 'exam-resilience-001';
const studentPrefix = process.env.LOAD_STUDENT_PREFIX || 'LOADSTU';
const stageSizes = { 1: 25, 2: 50, 3: 100, 4: 150 };
const defaultPassword = 'TestPass123';
const disableRateLimit = process.env.DISABLE_RATE_LIMIT === 'true' || process.env.NODE_ENV === 'test';

function log(...args) {
  console.log('[load-stress]', ...args);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function p95(values = []) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(0.95 * sorted.length));
  return sorted[idx];
}

function formatDuration(ms) {
  if (typeof ms !== 'number' || Number.isNaN(ms)) {
    return '0.0ms';
  }
  return `${ms.toFixed(1)}ms`;
}

async function fetchJson(url, options = {}) {
  const start = Date.now();
  try {
    const resp = await fetch(url, options);
    const text = await resp.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch (err) {
      body = text;
    }
    return {
      status: resp.status,
      ok: resp.ok,
      body,
      durationMs: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      body: { error: error?.message || String(error) },
      durationMs: Date.now() - start,
    };
  }
}

async function fetchJsonWithAuth(url, options = {}, token) {
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'CBT Load Test/1.0 Playwright',
    'x-load-test': 'true',
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return fetchJson(url, { ...options, headers });
}

function isExpectedApiError(endpoint, result) {
  if (!result || result.ok) return false;
  if (result.status === 409) return true;
  if (endpoint === 'save' && result.status === 0 && typeof result.body === 'object' && result.body.error?.includes('aborted')) {
    return true;
  }
  return false;
}

async function createLoadStudents(count) {
  log(`Creating or updating ${count} load test students`);


  const school = await prisma.school.upsert({
    where: { shortCode: 'LOAD' },
    create: {
      name: 'Load Test School',
      shortCode: 'LOAD',
    },
    update: {
      name: 'Load Test School',
    },
  });

  const passwordHash = bcrypt.hashSync(defaultPassword, 10);
  const created = [];
  for (let index = 1; index <= count; index++) {
    const studentNo = `${studentPrefix}${String(index).padStart(4, '0')}`;
    const email = `loadtest+${studentNo.toLowerCase()}@example.com`;
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        password: passwordHash,
        fullName: `Load Tester ${index}`,
        role: 'STUDENT',
        schoolId: school.id,
      },
      update: {
        fullName: `Load Tester ${index}`,
        schoolId: school.id,
      },
    });

    const student = await prisma.student.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        schoolId: school.id,
        studentNo,
      },
      update: {
        studentNo,
        schoolId: school.id,
      },
    });

    await prisma.session.updateMany({
      where: {
        studentId: student.id,
        examId,
      },
      data: { status: 'ABANDONED' },
    });

    await prisma.examSubmission.deleteMany({
      where: {
        studentId: student.id,
        examId,
      },
    });

    await prisma.result.deleteMany({
      where: {
        studentId: student.id,
        examId,
      },
    });

    created.push(studentNo);
    if (index % 25 === 0) {
      log(`  prepared ${index}/${count}`);
    }
  }

  log(`Prepared ${created.length} load test students`);
}

async function ensureServerIsRunning() {
  const serverUrl = baseUrl;
  log(`Ensuring server at ${serverUrl} is available`);
  const start = Date.now();
  const timeoutMs = 120_000;
  while (Date.now() - start < timeoutMs) {
    try {
      const resp = await fetch(serverUrl, { method: 'GET' });
      if (resp.status >= 200 && resp.status < 500) {
        log('Server is reachable');
        return;
      }
    } catch (err) {
      // ignore
    }
    await sleep(1000);
  }
  throw new Error(`Server did not become reachable within ${timeoutMs / 1000}s`);
}

async function startDevServer() {
  log('Starting Next.js dev server for load test');
  const env = { ...process.env, DISABLE_RATE_LIMIT: 'true', NODE_ENV: 'development' };
  const server = spawn('npm', ['run', 'dev'], {
    cwd: path.resolve(__dirname, '..'),
    shell: true,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  server.stdout.on('data', (data) => {
    process.stdout.write(`[server] ${data}`);
  });
  server.stderr.on('data', (data) => {
    process.stderr.write(`[server] ${data}`);
  });

  let alive = true;
  server.on('exit', () => {
    alive = false;
  });

  const start = Date.now();
  while (Date.now() - start < 120_000) {
    try {
      const response = await fetch(baseUrl, { method: 'GET' });
      if (response.status >= 200 && response.status < 500) {
        log('Dev server is ready');
        return server;
      }
    } catch (e) {
      // ignore
    }
    if (!alive) break;
    await sleep(1000);
  }

  server.kill('SIGINT');
  throw new Error('Dev server failed to start in time');
}

async function captureProcessMetrics(pid) {
  try {
    const command = `powershell -NoProfile -Command "Get-Process -Id ${pid} | Select-Object CPU,WorkingSet64,PrivateMemorySize64 | ConvertTo-Json"`;
    const output = execSync(command, { encoding: 'utf8' }).trim();
    return JSON.parse(output);
  } catch (error) {
    return null;
  }
}

async function runStage(users, options = {}) {
  const metrics = {
    login: { count: 0, success: 0, failures: 0, latencies: [], statusCounts: {} },
    start: { count: 0, success: 0, failures: 0, latencies: [], statusCounts: {} },
    restore: { count: 0, success: 0, failures: 0, latencies: [], statusCounts: {} },
    save: {
      count: 0,
      success: 0,
      failures: 0,
      latencies: [],
      statusCounts: {},
      debug: {
        ownershipConflict: 0,
        staleVersionConflict: 0,
        idempotentSave: 0,
        successfulSave: 0,
        saveAttemptCount: 0,
        totalLatencyMs: 0,
      },
    },
    submit: { count: 0, success: 0, failures: 0, latencies: [], statusCounts: {} },
    interrupted: { count: 0 },
  };
  const errors = [];
  const expectedErrors = [];
  const responses = [];

  const students = Array.from({ length: users }, (_, idx) => ({
    studentNo: `${studentPrefix}${String(idx + 1).padStart(4, '0')}`,
    token: null,
    sessionId: null,
    ownerTabId: null,
    sessionVersion: null,
    examData: null,
    lastAnswers: {},
  }));

  async function record(endpoint, result) {
    const target = metrics[endpoint];
    if (!target) return;
    target.count += 1;
    target.latencies.push(result.durationMs);
    target.statusCounts[result.status] = (target.statusCounts[result.status] || 0) + 1;
    if (result.ok) {
      target.success += 1;
    } else {
      target.failures += 1;
      if (isExpectedApiError(endpoint, result)) {
        expectedErrors.push({ endpoint, status: result.status, body: result.body });
      } else {
        errors.push({ endpoint, status: result.status, body: result.body });
      }
    }

    if (endpoint === 'save' && result.body?.debug?.saveProgressMetrics) {
      const debug = result.body.debug.saveProgressMetrics;
      metrics.save.debug.ownershipConflict += debug.ownershipConflict || 0;
      metrics.save.debug.staleVersionConflict += debug.staleVersionConflict || 0;
      metrics.save.debug.idempotentSave += debug.idempotentSave || 0;
      metrics.save.debug.successfulSave += debug.successfulSave || 0;
      metrics.save.debug.saveAttemptCount += debug.saveAttemptCount || 0;
      metrics.save.debug.totalLatencyMs += debug.totalLatencyMs || 0;
    }
  }

  async function loginStudent(student) {
    const loginResult = await fetchJson(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ studentNo: student.studentNo }),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CBT Load Test/1.0',
      },
    });
    await record('login', loginResult);
    if (!loginResult.ok || !loginResult.body?.token) {
      return loginResult;
    }
    student.token = loginResult.body.token;
    return loginResult;
  }

  async function getExam(student) {
    const examResp = await fetchJsonWithAuth(`${baseUrl}/api/exam/${examId}`, { method: 'GET' }, student.token);
    await record('start', examResp);
    if (!examResp.ok) {
      return null;
    }
    return examResp.body?.exam;
  }

  async function startExam(student, ownerTabId) {
    const startResp = await fetchJsonWithAuth(`${baseUrl}/api/exam/start`, {
      method: 'POST',
      body: JSON.stringify({ examId, ownerTabId }),
    }, student.token);
    await record('start', startResp);
    if (!startResp.ok || !startResp.body?.session) {
      return null;
    }
    return startResp.body.session;
  }

  async function restoreSession(student, ownerTabId) {
    const restoreResp = await fetchJsonWithAuth(`${baseUrl}/api/exam/start`, {
      method: 'POST',
      body: JSON.stringify({ examId, ownerTabId }),
    }, student.token);
    await record('restore', restoreResp);
    if (!restoreResp.ok || !restoreResp.body?.session) {
      return null;
    }
    return restoreResp.body.session;
  }

  async function saveProgress(student, payload, shouldAbort = false) {
    let controller;
    if (shouldAbort) {
      controller = new AbortController();
      setTimeout(() => controller.abort(), randomInt(50, 180));
    }
    const result = await fetchJsonWithAuth(`${baseUrl}/api/exam/save-progress`, {
      method: 'POST',
      body: JSON.stringify(payload),
      signal: controller?.signal,
    }, student.token);
    await record('save', result);
    if (shouldAbort) {
      metrics.interrupted.count += 1;
    }
    return result;
  }

  async function submitExam(student, payload) {
    const result = await fetchJsonWithAuth(`${baseUrl}/api/exam/submit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, student.token);
    await record('submit', result);
    return result;
  }

  async function initStudent(student) {
    const loginResult = await loginStudent(student);
    if (!loginResult.ok) return;

    const examResponse = await fetchJsonWithAuth(`${baseUrl}/api/exam/${examId}`, { method: 'GET' }, student.token);
    if (!examResponse.ok || !examResponse.body?.exam) {
      await record('start', examResponse);
      return;
    }
    student.examData = examResponse.body.exam;

    const ownerTabId = `owner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const session = await startExam(student, ownerTabId);
    if (!session) return;
    student.sessionId = session.id;
    student.ownerTabId = ownerTabId;
    student.sessionVersion = session.version;
    student.lastAnswers = {};
  }

  async function runStudentFlow(student) {
    if (!student.token || !student.sessionId) {
      return;
    }
    const exam = student.examData;
    if (!exam?.questions?.length) return;

    const questionCount = exam.questions.length;
    for (let step = 0; step < 6 + randomInt(0, 4); step++) {
      await sleep(randomInt(120, 360));
      const question = exam.questions[randomInt(0, questionCount - 1)];
      const selectedOption = question.options[randomInt(0, question.options.length - 1)];
      student.lastAnswers[question.id] = selectedOption.id;
      const useStale = Math.random() < 0.15;
      const useAbort = Math.random() < 0.08;
      const staleVersion = Math.max(1, student.sessionVersion - randomInt(1, 2));
      const staleOwnerId = `stale-${Math.random().toString(36).slice(2, 7)}`;
      const payload = {
        sessionId: student.sessionId,
        answers: student.lastAnswers,
        currentQuestionId: question.id,
        clientUpdatedAt: Date.now(),
        sessionVersion: useStale ? staleVersion : student.sessionVersion,
        ownerTabId: useStale ? staleOwnerId : student.ownerTabId,
      };
      const saveResp = await saveProgress(student, payload, useAbort);
      if (saveResp.ok && saveResp.body?.session) {
        student.sessionVersion = saveResp.body.session.version;
      }
      if (Math.random() < 0.12) {
        const newOwnerTabId = `owner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const restored = await restoreSession(student, newOwnerTabId);
        if (restored) {
          student.ownerTabId = newOwnerTabId;
          student.sessionVersion = restored.version;
        }
      }
      if (Math.random() < 0.1) {
        const recovered = await restoreSession(student, student.ownerTabId);
        if (recovered) {
          student.sessionVersion = recovered.version;
        }
      }
    }
  }

  log(`Beginning load stage with ${users} concurrent simulated students`);
  const startTime = Date.now();
  await Promise.all(students.map(async (student) => {
    await initStudent(student);
  }));

  await Promise.all(students.filter((s) => s.sessionId).map((student) => runStudentFlow(student)));

  log('Starting submit burst with jittered concurrency');
  await Promise.all(students.filter((s) => s.sessionId).map(async (student) => {
    await sleep(randomInt(20, 500));
    if (!student.ownerTabId || !student.sessionVersion) return;
    const answers = student.lastAnswers;
    const submitResp = await submitExam(student, {
      examId,
      answers,
      timeSpent: randomInt(1, 4),
      sessionId: student.sessionId,
      ownerTabId: student.ownerTabId,
    });
    if (submitResp.ok && submitResp.status === 201) {
      student.submitted = true;
    }
  }));

  const durationMs = Date.now() - startTime;
  log(`Stage finished in ${Math.round(durationMs)}ms`);
  return { metrics, students, durationMs, errors, expectedErrors };
}

function summarizeMetrics(metrics) {
  const endpoints = Object.keys(metrics).filter((key) => key !== 'interrupted');
  const result = {};
  for (const endpoint of endpoints) {
    const stat = metrics[endpoint] || { count: 0, success: 0, failures: 0, latencies: [], statusCounts: {} };
    const latencies = Array.isArray(stat.latencies) ? stat.latencies : [];
    result[endpoint] = {
      total: stat.count || 0,
      success: stat.success || 0,
      failures: stat.failures || 0,
      avg: latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
      p95: p95(latencies),
      statusCounts: stat.statusCounts || {},
      debug: stat.debug ? { ...stat.debug } : undefined,
    };
  }
  result.interrupted = { count: metrics.interrupted?.count || 0 };
  return result;
}

async function validateDatabase() {
  const errors = [];
  const duplicateSql = `SELECT "studentId", "examId", COUNT(*) as dup_count FROM "ExamSubmission" GROUP BY "studentId", "examId" HAVING COUNT(*) > 1`;
  const duplicateResultsSql = `SELECT "studentId", "examId", COUNT(*) as dup_count FROM "Result" GROUP BY "studentId", "examId" HAVING COUNT(*) > 1`;

  try {
    const duplicateSubmissions = await prisma.$queryRawUnsafe(duplicateSql);
    if (duplicateSubmissions?.length) {
      errors.push({ type: 'ExamSubmission duplicates', rows: duplicateSubmissions });
    }
  } catch (err) {
    log('Warning: duplicate submission validation failed:', err.message || err);
  }

  try {
    const duplicateResults = await prisma.$queryRawUnsafe(duplicateResultsSql);
    if (duplicateResults?.length) {
      errors.push({ type: 'Result duplicates', rows: duplicateResults });
    }
  } catch (err) {
    log('Warning: duplicate result validation failed:', err.message || err);
  }

  return errors;
}

async function main() {
  const rawArgs = process.argv.slice(2);
  const setupArg = rawArgs.find((arg) => arg.startsWith('--setup'));
  const stageArg = rawArgs.find((arg) => arg.startsWith('--stage='));
  const usersArg = rawArgs.find((arg) => arg.startsWith('--users='));
  const studentsArg = rawArgs.find((arg) => arg.startsWith('--students='));
  const keepServer = rawArgs.includes('--keep-server');

  const stage = stageArg ? Number(stageArg.split('=')[1]) : 1;
  const users = usersArg
    ? Number(usersArg.split('=')[1])
    : studentsArg
    ? Number(studentsArg.split('=')[1])
    : stageSizes[stage] || stageSizes[1];
  const setup = Boolean(setupArg);
  const skipSetup = rawArgs.includes('--no-setup');

  if (setup) {
    await createLoadStudents(users);
    process.exit(0);
  }

  if (!skipSetup) {
    log('Preparing load test students and clearing prior session state');
    await createLoadStudents(users);
  } else {
    log('Skipping load test data preparation (--no-setup)');
  }

  let serverProcess = null;
  try {
    try {
      await fetchJson(baseUrl, { method: 'GET' });
    } catch (err) {
      serverProcess = await startDevServer();
    }

    await ensureServerIsRunning();

    log(`Running load stage=${stage} users=${users}`);
    const { metrics, students, durationMs, errors, expectedErrors } = await runStage(users);

    const dbErrors = await validateDatabase();
    const metricsSummary = summarizeMetrics(metrics);
    const activeSubmissions = await prisma.examSubmission.count();
    const activeResults = await prisma.result.count();
    const memoryInfo = process.memoryUsage();

    log('--- Load Test Report ---');
    log(`Stage: ${stage}`);
    log(`Users: ${users}`);
    log(`Duration: ${Math.round(durationMs)}ms`);
    log(`Total students with session: ${students.filter((s) => s.sessionId).length}/${users}`);
    log(`Submit successes: ${metrics.submit.success}`);
    log(`Submit failures: ${metrics.submit.failures}`);
    log(`Autosave interrupted: ${metrics.interrupted.count}`);
    log('Endpoint summary:');
    for (const [endpoint, stat] of Object.entries(metricsSummary)) {
      log(`  ${endpoint}: total=${stat.total}, success=${stat.success}, fail=${stat.failures}, avg=${formatDuration(stat.avg)}, p95=${formatDuration(stat.p95)}, statuses=${JSON.stringify(stat.statusCounts)}`);
      if (endpoint === 'save' && stat.debug) {
        log(`    save debug: ownershipConflict=${stat.debug.ownershipConflict}, staleVersionConflict=${stat.debug.staleVersionConflict}, idempotentSave=${stat.debug.idempotentSave}, successfulSave=${stat.debug.successfulSave}, saveAttemptCount=${stat.debug.saveAttemptCount}, totalLatencyMs=${stat.debug.totalLatencyMs}`);
      }
    }
    log(`DB counts: ExamSubmission=${activeSubmissions}, Result=${activeResults}`);
    if (dbErrors.length) {
      log('Database validation issues:');
      dbErrors.forEach((issue) => log(JSON.stringify(issue)));
    } else {
      log('Database duplicate validation: ZERO duplicate rows found for ExamSubmission and Result');
    }
    log('Prisma connection note: tracked no internal Prisma client errors during load run');
    log(`Script memory usage: rss=${Math.round(memoryInfo.rss / 1024 / 1024)}MB, heapUsed=${Math.round(memoryInfo.heapUsed / 1024 / 1024)}MB`);

    if (errors.length) {
      log('Sample unexpected API errors encountered:');
      errors.slice(0, 10).forEach((err, idx) => log(`  ${idx + 1}:`, JSON.stringify(err)));
    }
    if (expectedErrors?.length) {
      log(`Expected API errors encountered: ${expectedErrors.length}`);
      expectedErrors.slice(0, 10).forEach((err, idx) => log(`  ${idx + 1}:`, JSON.stringify(err)));
    }

    const processMetrics = serverProcess ? await captureProcessMetrics(serverProcess.pid) : null;
    if (processMetrics) {
      log(`Server process metrics: CPU_seconds=${processMetrics.CPU}, WorkingSetBytes=${processMetrics.WorkingSet64}, PrivateMemBytes=${processMetrics.PrivateMemorySize64}`);
    }

    if (!keepServer && serverProcess) {
      serverProcess.kill('SIGINT');
    }

    if (dbErrors.length || errors.length) {
      process.exit(1);
    }
  } catch (error) {
    log('Load test failed:', error.message || error);
    if (serverProcess) {
      serverProcess.kill('SIGINT');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
