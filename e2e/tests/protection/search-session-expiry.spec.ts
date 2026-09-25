import { expect, test } from '@playwright/test'

// Stack compose.e2e-protection.yaml: sessão de 60 s (ADR 0020). Spec 003, US1
// cenário 9: a sessão expira durante a digitação e a busca continua.
test('keeps the typed text and shows suggestions after the session expires', async ({ page }) => {
    test.setTimeout(120_000)
    let sessions = 0
    page.on('request', (request) => {
        if (request.method() === 'POST' && request.url().endsWith('/api/session')) {
            sessions += 1
        }
    })

    await page.goto('/municipalities')
    await expect.poll(() => sessions, { timeout: 3000 }).toBe(1)
    const field = page.getByRole('combobox', { name: 'Município' })
    await field.fill('sao')
    await expect(page.getByRole('option').first()).toBeVisible()

    await page.waitForTimeout(61_000)

    await field.pressSequentially(' pau')
    await expect(page.getByRole('option', { name: 'São Paulo/SP', exact: true })).toBeVisible({
        timeout: 5000,
    })
    await expect(field).toHaveValue('sao pau')
    expect(sessions).toBe(2)
})
