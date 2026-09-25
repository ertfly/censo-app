import { expect, test } from '@playwright/test'

test.describe('AI robots', () => {
    for (const userAgent of [
        'Mozilla/5.0 (compatible; GPTBot/1.1; +https://openai.com/gptbot)',
        'Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
    ]) {
        test(`refuses ${userAgent.split(';')[1]?.trim() ?? userAgent}`, async ({ playwright }) => {
            const bot = await playwright.request.newContext({
                baseURL: process.env.E2E_BASE_URL ?? 'http://localhost',
                extraHTTPHeaders: { 'user-agent': userAgent },
            })
            expect((await bot.get('/')).status()).toBe(403)
            expect((await bot.get('/api/health')).status()).toBe(403)
            await bot.dispose()
        })
    }

    test('publishes the rules for robots', async ({ request }) => {
        const response = await request.get('/robots.txt')
        expect(response.status()).toBe(200)
        const rules = await response.text()
        expect(rules).toContain('User-agent: *\nDisallow: /api/')
        expect(rules).toContain('User-agent: GPTBot\nDisallow: /')
        expect(rules).toContain('User-agent: Google-Extended\nDisallow: /')
    })

    test('lets a common browser in', async ({ request }) => {
        expect((await request.get('/')).status()).toBe(200)
    })
})
