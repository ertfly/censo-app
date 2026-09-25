import { expect, test } from '@playwright/test'

// Stack compose.e2e-protection.yaml: sessão de 60 s (ADR 0020).
test('verifies again after the session expires', async ({ page }) => {
    test.setTimeout(120_000)
    let sessions = 0
    page.on('request', (request) => {
        if (request.method() === 'POST' && request.url().endsWith('/api/session')) {
            sessions += 1
        }
    })

    await page.goto('/municipalities')
    await expect.poll(() => sessions, { timeout: 3000 }).toBe(1)
    const cookie = (await page.context().cookies()).find((item) => item.name === 'censo_session')
    expect(cookie).toBeDefined()

    await page.waitForTimeout(61_000)

    const expired = await page.request.get('/api/states')
    expect(expired.status()).toBe(401)

    await page.reload()
    await expect.poll(() => sessions, { timeout: 3000 }).toBe(2)
    await expect(page.locator('header [aria-live="polite"]')).toHaveText('', { timeout: 3000 })
})
