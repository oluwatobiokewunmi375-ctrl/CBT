import { request, type FullConfig } from '@playwright/test'

export default async function globalSetup(config: FullConfig) {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000'
  const requestContext = await request.newContext({ baseURL })

  const response = await requestContext.post('/api/seed', {
    data: {
      key: 'CBT_SEED_2024',
    },
  })

  if (!response.ok()) {
    const body = await response.text()
    await requestContext.dispose()
    throw new Error(`Playwright global setup failed to seed test data: ${response.status()} ${body}`)
  }

  await requestContext.dispose()
}
