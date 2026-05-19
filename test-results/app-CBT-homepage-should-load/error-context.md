# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> CBT homepage should load
- Location: tests-e2e\app.spec.ts:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /localhost|127.0.0.1/
Received string:  ""

Call log:
  - Expect "toHaveURL" with timeout 5000ms

```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test"
  2  | 
  3  | test("CBT homepage should load", async ({ page }) => {
  4  | 
  5  |   await page.goto("http://127.0.0.1:3000", {
  6  |     waitUntil: "domcontentloaded",
  7  |     timeout: 60000
  8  |   })
  9  | 
> 10 |   await expect(page).toHaveURL(/localhost|127.0.0.1/)
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  11 | 
  12 | })
  13 | 
```