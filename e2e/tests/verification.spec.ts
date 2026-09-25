import { expect, type Page, test } from '@playwright/test'

function countSessionRequests(page: Page): () => number {
    let count = 0
    page.on('request', (request) => {
        if (request.method() === 'POST' && request.url().endsWith('/api/session')) {
            count += 1
        }
    })
    return () => count
}

test.describe('automatic verification', () => {
    test('verifies the browser on load without asking for anything', async ({ page }) => {
        const sessions = countSessionRequests(page)
        await page.goto('/municipalities')
        const status = page.locator('header [aria-live="polite"]')
        await expect.poll(() => sessions(), { timeout: 3000 }).toBe(1)
        await expect(status).toHaveText('', { timeout: 3000 })
        await expect(page.getByRole('alert')).toHaveCount(0)
        await expect(page.getByRole('textbox', { name: /e-mail|senha/i })).toHaveCount(0)
    })

    test('does not verify again in another tab of the same browser', async ({ page, context }) => {
        const firstTab = countSessionRequests(page)
        await page.goto('/municipalities')
        await expect.poll(() => firstTab(), { timeout: 3000 }).toBe(1)

        const secondPage = await context.newPage()
        const secondTab = countSessionRequests(secondPage)
        await secondPage.goto('/states')
        await expect(secondPage.getByRole('navigation', { name: 'Telas' })).toBeVisible()
        await secondPage.waitForTimeout(1000)
        expect(secondTab()).toBe(0)
    })

    test('refuses queries without a session', async ({ request }) => {
        const response = await request.get('/api/states')
        expect(response.status()).toBe(401)
        expect(await response.json()).toEqual({ code: 'SESSION_REQUIRED' })
    })

    test('explains that JavaScript is required', async ({ browser }) => {
        const context = await browser.newContext({ javaScriptEnabled: false })
        const page = await context.newPage()
        await page.goto('/municipalities')
        // O seletor de texto do Playwright ignora <noscript>; o innerText mostra o que aparece.
        const text = await page.evaluate(() => document.body.innerText)
        expect(text).toContain('Esta consulta precisa de JavaScript ativado no navegador.')
        await context.close()
    })
})
