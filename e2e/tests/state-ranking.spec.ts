import { expect, type Page, test } from '@playwright/test'

// Cenários do quickstart da feature 002, contra a cópia do censo.sqlite.

const INVALID_ADDRESS =
    'Este endereço não corresponde a nenhuma unidade federativa. Escolha uma na lista.'

function stateSelect(page: Page) {
    return page.getByRole('combobox', { name: 'Unidade federativa' })
}

function rankingRows(page: Page) {
    return page.locator('[data-ranking] tbody tr')
}

async function waitForVerification(page: Page): Promise<void> {
    await expect(stateSelect(page)).not.toHaveAttribute('aria-disabled', 'true', {
        timeout: 5000,
    })
}

async function chooseState(page: Page, label: string): Promise<void> {
    await stateSelect(page).click()
    await page.getByRole('option', { name: label, exact: true }).click()
}

function filterField(page: Page) {
    return page.getByRole('textbox', { name: 'Filtrar municípios' })
}

test.describe('state ranking', () => {
    test('opens from the menu (scenario 1)', async ({ page }) => {
        await page.goto('/municipalities')
        await page
            .getByRole('navigation', { name: 'Telas' })
            .getByRole('link', { name: 'Busca por estado' })
            .click()
        await expect(page).toHaveURL(/\/states$/)
        await expect(
            page.getByRole('navigation', { name: 'Telas' }).getByRole('link', {
                name: 'Busca por estado',
            }),
        ).toHaveAttribute('aria-current', 'page')
        await expect(
            page.getByText(
                'Escolha uma unidade federativa para ver seus municípios ordenados por densidade.',
            ),
        ).toBeVisible()
    })

    test('lists the 27 states in alphabetical order (scenario 2)', async ({ page }) => {
        await page.goto('/states')
        await waitForVerification(page)
        await stateSelect(page).click()
        const options = page.getByRole('option')
        await expect(options).toHaveCount(27)
        await expect(options.first()).toHaveText('Acre/AC')
        await expect(options.nth(2)).toHaveText('Amapá/AP')
        await expect(options.last()).toHaveText('Tocantins/TO')
    })

    test('ranks Minas Gerais by density (scenario 3)', async ({ page }) => {
        await page.goto('/states')
        await waitForVerification(page)
        await chooseState(page, 'Minas Gerais/MG')
        await expect(page).toHaveURL(/\/states\/31$/)
        await expect(page.getByRole('heading', { level: 2 })).toHaveText('Minas Gerais/MG')
        await expect(rankingRows(page)).toHaveCount(853)
        await expect(page.getByText('853 municípios', { exact: true })).toBeVisible()
        const densities = await page
            .locator('[data-ranking] tbody tr [data-density]')
            .evaluateAll((cells) => cells.map((cell) => Number(cell.getAttribute('data-density'))))
        for (let index = 1; index < densities.length; index += 1) {
            expect(densities[index]).toBeLessThanOrEqual(densities[index - 1]!)
        }
    })

    test('shows a single row for the Distrito Federal (scenario 4)', async ({ page }) => {
        await page.goto('/states/53')
        await expect(rankingRows(page)).toHaveCount(1)
        await expect(rankingRows(page).first()).toContainText('Brasília')
    })

    test('filters keeping the ranking position (scenarios 6 and 7)', async ({ page }) => {
        await page.goto('/states/31')
        await expect(rankingRows(page)).toHaveCount(853)
        const fullRow = rankingRows(page).filter({ hasText: 'Juiz de Fora' })
        const position = await fullRow.locator('[data-position]').textContent()

        await filterField(page).fill('juiz')
        await expect(rankingRows(page)).toHaveCount(1)
        await expect(rankingRows(page).first().locator('[data-position]')).toHaveText(position!)
        await expect(page.getByText('1 de 853 municípios', { exact: true })).toBeVisible()

        await filterField(page).fill('xyz')
        await expect(
            page.getByText('Nenhum município de Minas Gerais corresponde a "xyz".'),
        ).toBeVisible()
    })

    test('clears the filter when another state is chosen (scenario 8)', async ({ page }) => {
        await page.goto('/states/31')
        await expect(rankingRows(page)).toHaveCount(853)
        await filterField(page).fill('juiz')
        await chooseState(page, 'Bahia/BA')
        await expect(page).toHaveURL(/\/states\/29$/)
        await expect(page.getByRole('heading', { level: 2 })).toHaveText('Bahia/BA')
        await expect(filterField(page)).toHaveValue('')
        await expect(page.getByText('417 municípios', { exact: true })).toBeVisible()
    })

    test('keeps the state after reloading (scenario 9)', async ({ page }) => {
        await page.goto('/states/31')
        await expect(page.getByRole('heading', { level: 2 })).toHaveText('Minas Gerais/MG')
        await page.reload()
        await expect(page.getByRole('heading', { level: 2 })).toHaveText('Minas Gerais/MG')
        await expect(rankingRows(page)).toHaveCount(853)
    })

    for (const address of ['/states/99', '/states/abc']) {
        test(`explains an invalid address ${address} (scenario 10)`, async ({ page }) => {
            await page.goto(address)
            await expect(page.getByText(INVALID_ADDRESS)).toBeVisible()
            await expect(page.getByRole('heading', { level: 2 })).toHaveCount(0)
        })
    }

    test('orders exact-looking ties by the unrounded density (US1 scenario 11)', async ({
        page,
    }) => {
        await page.goto('/states/31')
        await expect(rankingRows(page)).toHaveCount(853)
        const position = async (name: string) =>
            Number(
                await rankingRows(page)
                    .filter({ hasText: name })
                    .locator('[data-position]')
                    .textContent(),
            )
        const aguas = await position('Águas Vermelhas')
        const luminarias = await position('Luminárias')
        expect(aguas).toBeLessThan(luminarias)
        await expect(rankingRows(page).filter({ hasText: 'Águas Vermelhas' })).toContainText(
            '11,17',
        )
        await expect(rankingRows(page).filter({ hasText: 'Luminárias' })).toContainText('11,17')
    })
})
