import { expect, type Page, test } from '@playwright/test'

// Cenários do quickstart da feature 001, contra a cópia do censo.sqlite.

function searchField(page: Page) {
    return page.getByRole('combobox', { name: 'Município' })
}

async function openSearch(page: Page): Promise<void> {
    await page.goto('/')
    await expect(searchField(page)).not.toHaveAttribute('aria-disabled', 'true', {
        timeout: 5000,
    })
}

test.describe('municipality search', () => {
    test('opens the city search from the main address (scenario 1)', async ({ page }) => {
        await page.goto('/')
        await expect(page).toHaveURL(/\/municipalities$/)
        const current = page.getByRole('navigation', { name: 'Telas' }).getByRole('link', {
            name: 'Busca de cidades',
        })
        await expect(current).toHaveAttribute('aria-current', 'page')
    })

    test('ignores accents and case (scenario 3)', async ({ page }) => {
        await openSearch(page)
        await searchField(page).fill('sao pau')
        await expect(page.getByRole('option', { name: 'São Paulo/SP', exact: true })).toBeVisible()
    })

    test('says when nothing matches (scenario 5)', async ({ page }) => {
        await openSearch(page)
        await searchField(page).fill('aulo')
        await expect(page.getByRole('listbox')).toContainText(
            'Nenhum município encontrado para "aulo".',
        )
        await expect(page.getByRole('option')).toHaveCount(0)
    })

    test('lists homonyms by state before longer names (scenario 6)', async ({ page }) => {
        await openSearch(page)
        await searchField(page).fill('BOM JESUS')
        const names = page.getByRole('option')
        await expect(names).toHaveCount(10)
        await expect(names).toContainText([
            'Bom Jesus/PB',
            'Bom Jesus/PI',
            'Bom Jesus/RN',
            'Bom Jesus/RS',
            'Bom Jesus/SC',
            'Bom Jesus da Lapa/BA',
        ])
    })

    test('treats the apostrophe as a word separator (scenario 11)', async ({ page }) => {
        await openSearch(page)
        await searchField(page).fill('arco')
        await expect(page.getByRole('option', { name: "Pau D'Arco/PA", exact: true })).toBeVisible()
        await expect(page.getByRole('option', { name: "Pau D'Arco/TO", exact: true })).toBeVisible()
    })
})
