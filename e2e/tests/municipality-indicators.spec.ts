import Database from 'better-sqlite3'
import { expect, type Page, test } from '@playwright/test'

// Ficha do município (quickstart da 001, cenários 7 a 10, 12 e 13; FR-014,
// FR-025; SC-004), contra a cópia do censo.sqlite.

const INVALID_ADDRESS = 'Este endereço não corresponde a nenhum município. Busque pelo nome.'

function searchField(page: Page) {
    return page.getByRole('combobox', { name: 'Município' })
}

function recordTitle(page: Page) {
    return page.getByRole('heading', { level: 2 })
}

async function waitForVerification(page: Page): Promise<void> {
    await expect(searchField(page)).not.toHaveAttribute('aria-disabled', 'true', {
        timeout: 5000,
    })
}

async function choose(page: Page, text: string, option: string): Promise<void> {
    await searchField(page).fill(text)
    await page.getByRole('option', { name: option, exact: true }).click()
}

const integer = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const decimal2 = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

interface Totals {
    tracts: number
    population: number
    area: number
    men: number
    women: number
}

function totalsFromDatabase(code: string): Totals {
    const db = new Database(process.env.E2E_DATABASE_PATH ?? '.tmp/censo.sqlite', {
        readonly: true,
    })
    try {
        return db
            .prepare(
                `SELECT COUNT(*) AS tracts, SUM(s.populacao) AS population, SUM(s.area_km2) AS area,
                        SUM(COALESCE(d.homens, 0)) AS men, SUM(COALESCE(d.mulheres, 0)) AS women
                 FROM setor s LEFT JOIN demografia d USING (cd_setor)
                 WHERE s.cd_mun = ?`,
            )
            .get(code) as Totals
    } finally {
        db.close()
    }
}

test.describe('municipality indicators', () => {
    test('chooses with the keyboard and shows the six indicators (scenario 7)', async ({
        page,
    }) => {
        await page.goto('/municipalities')
        await waitForVerification(page)
        await searchField(page).fill('sao paulo')
        await expect(page.getByRole('option').first()).toBeVisible()
        await searchField(page).press('Enter')

        await expect(page).toHaveURL(/\/municipalities\/3550308$/)
        await expect(recordTitle(page)).toHaveText('São Paulo/SP')
        for (const label of [
            'População',
            'Setores censitários',
            'Área',
            'Densidade demográfica',
            'Urbano e rural',
            'Sexo',
        ]) {
            await expect(page.getByText(label, { exact: true }).first()).toBeVisible()
        }
    })

    test('keeps the municipality after reloading (scenario 8)', async ({ page }) => {
        await page.goto('/municipalities/3550308')
        await expect(recordTitle(page)).toHaveText('São Paulo/SP')
        await page.reload()
        await expect(recordTitle(page)).toHaveText('São Paulo/SP')
    })

    for (const address of [
        '/municipalities/9999999',
        '/municipalities/abc',
        '/municipalities/3500000',
    ]) {
        test(`explains an invalid address ${address} (scenario 9)`, async ({ page }) => {
            await page.goto(address)
            await expect(page.getByText(INVALID_ADDRESS)).toBeVisible()
            await expect(searchField(page)).toHaveValue('')
            await expect(recordTitle(page)).toHaveCount(0)
        })
    }

    test('shows unclassified tracts (scenario 10)', async ({ page }) => {
        await page.goto('/municipalities/1500107')
        await expect(recordTitle(page)).toHaveText('Abaetetuba/PA')
        await expect(page.getByText('Sem classificação').first()).toBeVisible()
    })

    test('shows unknown sex with the note and percentages adding up to 100 (scenario 10)', async ({
        page,
    }) => {
        await page.goto('/municipalities/3304557')
        await expect(recordTitle(page)).toHaveText('Rio de Janeiro/RJ')
        await expect(
            page.getByText('Parte da população não tem informação de sexo na base do Censo.'),
        ).toBeVisible()
        for (const breakdown of ['area-type-tracts', 'area-type-population', 'sex']) {
            const values = await page
                .locator(`[data-breakdown="${breakdown}"] [data-percent]`)
                .allTextContents()
            const total = values.reduce(
                (sum, value) => sum + Number(value.replace('%', '').replace(',', '.').trim()),
                0,
            )
            expect(total).toBeCloseTo(100, 5)
        }
    })

    test('names the tab and shows the source (scenario 12)', async ({ page }) => {
        await page.goto('/municipalities/3550308')
        await expect(recordTitle(page)).toHaveText('São Paulo/SP')
        await expect(page).toHaveTitle('São Paulo/SP - Censo 2022')
        await expect(page.getByText('Fonte: IBGE, Censo Demográfico 2022')).toBeVisible()
    })

    test('works on a 360px screen (scenario 13)', async ({ page }) => {
        await page.setViewportSize({ width: 360, height: 740 })
        await page.goto('/municipalities')
        await waitForVerification(page)
        await choose(page, 'sao pau', 'São Paulo/SP')
        await expect(recordTitle(page)).toHaveText('São Paulo/SP')
        const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        )
        expect(overflow).toBe(0)
    })

    test('replaces the record when another municipality is chosen (FR-014)', async ({ page }) => {
        await page.goto('/municipalities/3550308')
        await expect(recordTitle(page)).toHaveText('São Paulo/SP')
        await choose(page, 'campinas', 'Campinas/SP')
        await expect(page).toHaveURL(/\/municipalities\/3509502$/)
        await expect(recordTitle(page)).toHaveText('Campinas/SP')
        await expect(page.getByRole('heading', { name: 'São Paulo/SP' })).toHaveCount(0)
    })

    test('goes back to the page before the search (FR-025)', async ({ page }) => {
        await page.goto('/states')
        await page
            .getByRole('navigation', { name: 'Telas' })
            .getByRole('link', {
                name: 'Busca de cidades',
            })
            .click()
        await waitForVerification(page)
        await choose(page, 'salvador', 'Salvador/BA')
        await expect(recordTitle(page)).toHaveText('Salvador/BA')
        await choose(page, 'manaus', 'Manaus/AM')
        await expect(recordTitle(page)).toHaveText('Manaus/AM')

        await page.goBack()
        await expect(page).toHaveURL(/\/states$/)
    })

    // SC-004: a ficha confere com a consulta direta à base.
    for (const code of ['3550308', '2927408', '2201903', '1500107', '3304557']) {
        test(`matches the database for ${code} (SC-004)`, async ({ page }) => {
            const totals = totalsFromDatabase(code)
            await page.goto(`/municipalities/${code}`)
            await expect(recordTitle(page)).toBeVisible()
            await expect(page.locator('[data-indicator="population"]')).toHaveText(
                integer.format(totals.population),
            )
            await expect(page.locator('[data-indicator="census-tracts"]')).toHaveText(
                integer.format(totals.tracts),
            )
            await expect(page.locator('[data-indicator="area"]')).toContainText(
                decimal2.format(totals.area),
            )
            await expect(page.locator('[data-indicator="density"]')).toContainText(
                decimal2.format(totals.population / totals.area),
            )
            const screenReaderText = (
                await page.locator('[data-breakdown="sex"] .sr-only').allTextContents()
            ).join(' ')
            expect(screenReaderText).toContain(`Mulheres: ${integer.format(totals.women)} pessoas`)
            expect(screenReaderText).toContain(`Homens: ${integer.format(totals.men)} pessoas`)
        })
    }
})
