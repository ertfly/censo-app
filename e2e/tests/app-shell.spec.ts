import { expect, test } from '@playwright/test'

test.describe('app shell', () => {
    test('opens the city search from the main address', async ({ page }) => {
        await page.goto('/')
        await expect(page).toHaveURL(/\/municipalities$/)
        await expect(page).toHaveTitle('Censo 2022')
    })

    test('marks the current screen in the fixed menu', async ({ page }) => {
        await page.goto('/')
        const menu = page.getByRole('navigation', { name: 'Telas' })
        await expect(menu.getByRole('link', { name: 'Busca de cidades' })).toHaveAttribute(
            'aria-current',
            'page',
        )
        await menu.getByRole('link', { name: 'Busca por estado' }).click()
        await expect(page).toHaveURL(/\/states$/)
        await expect(menu.getByRole('link', { name: 'Busca por estado' })).toHaveAttribute(
            'aria-current',
            'page',
        )
    })

    test('shows the data source', async ({ page }) => {
        await page.goto('/')
        await expect(page.getByText('Fonte: IBGE, Censo Demográfico 2022')).toBeVisible()
    })

    test('reaches the API through the same origin', async ({ request }) => {
        const response = await request.get('/api/health')
        expect(response.status()).toBe(200)
        expect(await response.json()).toEqual({ status: 'ok' })
    })
})
