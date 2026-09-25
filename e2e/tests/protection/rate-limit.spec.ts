import { expect, test } from '@playwright/test'
import { createApiSession } from '../../helpers/api-session'

// Stack compose.e2e-protection.yaml: limite real de 120 por minuto (ADR 0020).
test('blocks for 1 minute after too many queries and then lets them through', async ({
    page,
    request,
}) => {
    test.setTimeout(150_000)
    await createApiSession(request)

    let blocked: Awaited<ReturnType<typeof request.get>> | undefined
    for (let index = 0; index < 130 && !blocked; index += 1) {
        const response = await request.get('/api/states')
        if (response.status() === 429) {
            blocked = response
        }
    }
    expect(blocked, 'the 121st request in a minute should be blocked').toBeDefined()
    expect(await blocked?.json()).toMatchObject({ code: 'RATE_LIMIT_EXCEEDED' })
    expect(Number(blocked?.headers()['retry-after'])).toBeGreaterThan(0)

    // A página, do mesmo acesso, mostra o aviso com a contagem regressiva.
    await page.goto('/municipalities')
    await expect(page.getByRole('alert')).toContainText('Você fez muitas consultas em pouco tempo.')

    await page.waitForTimeout(61_000)
    const afterBlock = await request.get('/api/states')
    expect(afterBlock.status()).not.toBe(429)
})
