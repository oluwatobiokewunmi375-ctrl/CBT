const { chromium } = require('@playwright/test')
const http = require('node:http')

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchLoginPage(baseUrl) {
  return new Promise((resolve) => {
    const req = http.request(`${baseUrl}/login`, { method: 'GET', headers: { 'Cache-Control': 'no-cache' } }, (res) => {
      let body = ''
      res.on('data', (chunk) => {
        body += chunk
      })
      res.on('end', () => {
        resolve({ status: res.statusCode, body })
      })
    })

    req.on('error', (error) => {
      resolve({ status: 0, error: error.message })
    })

    req.setTimeout(5000, () => {
      req.destroy()
      resolve({ status: 0, error: 'request timeout' })
    })

    req.end()
  })
}

async function waitForServerReady(baseUrl, maxAttempts = 30, intervalMs = 2000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    console.log(`SERVER CHECK [${attempt}/${maxAttempts}] ${baseUrl}/login`)
    const result = await fetchLoginPage(baseUrl)
    if (result.status === 200 && typeof result.body === 'string' && result.body.toLowerCase().includes('<html')) {
      console.log('SERVER READY:', baseUrl)
      return
    }

    console.log('SERVER NOT READY:', result.status, result.error || 'no html detected')
    await sleep(intervalMs)
  }

  throw new Error(`Server did not become ready at ${baseUrl}/login after ${maxAttempts} attempts`)
}

(async () => {
  const baseUrl = 'http://127.0.0.1:3000'
  await waitForServerReady(baseUrl)

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.addInitScript(() => {
    const originalError = console.error.bind(console)
    console.error = (...args) => {
      originalError(...args)
      try {
        const stack = new Error().stack
        originalError('INSTRUMENTED STACKTRACE', stack)
      } catch (_err) {
        originalError('INSTRUMENTED STACKTRACE FAILED')
      }
    }
  })

  page.on('console', (msg) => {
    const text = msg.text()
    const type = msg.type()
    const location = msg.location ? msg.location() : null
    console.log(`PAGE CONSOLE [${type}] ${text}`)

    if (/hydration|react|mismatch|undefined|error|failed|warning/i.test(text)) {
      console.log('PAGE CONSOLE DIAGNOSTIC:', type, text, location ? `at ${location.url}:${location.lineNumber}:${location.columnNumber}` : '')
    }
  })

  page.on('pageerror', (error) => {
    console.log('PAGE ERROR', error.stack || error.message)
  })

  page.on('requestfailed', (request) => {
    const failure = request.failure()
    console.log(
      'REQUEST FAILED',
      request.method(),
      request.url(),
      failure?.errorText || 'unknown failure'
    )
  })

  page.on('response', (response) => {
    const request = response.request()
    const method = request.method()
    const status = response.status()
    const url = response.url()
    const location = response.headers()['location']
    const redirect = status >= 300 && status < 400 ? ` location=${location || 'none'}` : ''
    console.log(`RESPONSE ${method} ${status} ${url}${redirect}`)
  })

  const logCurrentUrl = async (label) => {
    console.log(`${label}: ${page.url()}`)
  }

  console.log('goto login')
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await logCurrentUrl('after goto login')

  const loginResponse = await page.evaluate(async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentNo: 'STURESIL001' }),
    })
    const body = await res.text()
    return { status: res.status, ok: res.ok, body }
  })
  console.log('direct login response', loginResponse)
  await page.evaluate(() => {
    window.location.href = '/exam-list'
  })
  await page.waitForURL(/\/exam-list/, { timeout: 60000 })
  await logCurrentUrl('at exam list')

  const startButton = page.getByRole('button', { name: /Start Exam/i }).first()
  console.log('start button count', await startButton.count())
  await Promise.all([
    page.waitForURL(/\/exam\//, { timeout: 60000 }),
    startButton.click(),
  ])
  await logCurrentUrl('after click start exam')

  console.log('page body preview:', await page.evaluate(() => document.body.innerText.slice(0, 500)))

  const cookies = await context.cookies()
  console.log('cookies:', cookies.map((cookie) => ({
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
    expires: cookie.expires,
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
  })))

  try {
    await page.waitForSelector('text=Time remaining', { timeout: 60000 })
    console.log('FOUND TIME REMAINING')
  } catch (error) {
    console.log('TIME REMAINING MISSING', error.message)
    console.log('visible text contains Time remaining:', await page.evaluate(() => document.body.innerText.includes('Time remaining')))
    console.log('PAGE HTML START')
    console.log(await page.content())
    console.log('PAGE HTML END')
  }

  console.log('ownerTabId:', await page.evaluate(() => sessionStorage.getItem('cbt_exam_owner_tab_id')))

  await browser.close()
})().catch((err) => {
  console.error('SCRIPT ERROR', err)
  process.exit(1)
})
