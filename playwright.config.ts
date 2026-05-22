import { defineConfig } from "@playwright/test"

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000"

export default defineConfig({
  testDir: "./tests-e2e",
  globalSetup: "./tests-e2e/global.setup.ts",
  timeout: 60000,
  expect: {
    timeout: 15000,
  },
  retries: 1,
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL,
    headless: true,
    actionTimeout: 60000,
    navigationTimeout: 60000,
  },
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120000,
  },
})
