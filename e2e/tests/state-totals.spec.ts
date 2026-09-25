import Database from 'better-sqlite3'
import { expect, test } from '@playwright/test'

// Totais da UF (spec 002 US2) e conferência com a base para as 27 UFs
// (SC-002, SC-003; consultas do quickstart), contra a cópia do censo.sqlite.

const integer = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const decimal2 = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

interface Totals {
    population: number
    area: number
}

function openDatabase() {
    return new Database(process.env.E2E_DATABASE_PATH ?? '.tmp/censo.sqlite', { readonly: true })
}

function nextCode(code: string): string {
    return String(Number(code) + 1).padStart(2, '0')
}

function expectedFor(code: string): { totals: Totals; ranking: string[] } {
    const db = openDatabase()
    try {
        const totals = db
            .prepare(
                `SELECT SUM(populacao) AS population, SUM(area_km2) AS area FROM setor
                 WHERE cd_setor >= ? AND cd_setor < ?`,
            )
            .get(code, nextCode(code)) as Totals
        const rows = db
            .prepare(
                `SELECT m.nm_mun AS name, SUM(s.populacao) * 1.0 / SUM(s.area_km2) AS density
                 FROM setor s JOIN municipio m USING (cd_mun)
                 WHERE m.cd_uf = ? AND s.cd_mun <> '.'
                 GROUP BY s.cd_mun`,
            )
            .all(code) as { name: string; density: number }[]
        const collator = new Intl.Collator('pt-BR')
        rows.sort((a, b) => b.density - a.density || collator.compare(a.name, b.name))
        return { totals, ranking: rows.map((row) => row.name) }
    } finally {
        db.close()
    }
}

function stateCodes(): string[] {
    const db = openDatabase()
    try {
        return (db.prepare('SELECT cd_uf FROM uf ORDER BY cd_uf').all() as { cd_uf: string }[]).map(
            (row) => row.cd_uf,
        )
    } finally {
        db.close()
    }
}

test('shows the area outside the municipalities of Rio Grande do Sul (US2 scenario 4)', async ({
    page,
}) => {
    await page.goto('/states/43')
    await expect(page.getByRole('heading', { level: 2 })).toHaveText('Rio Grande do Sul/RS')
    await expect(page.locator('[data-indicator="area"]')).toContainText('281.707,15')
    await expect(
        page.getByText(
            'Inclui 13.085,86 km² fora dos municípios, registrados sem município na base do Censo.',
        ),
    ).toBeVisible()
    await expect(page.locator('[data-ranking] tbody tr th')).not.toContainText([''])
})

for (const code of stateCodes()) {
    test(`matches the database for the state ${code} (SC-002, SC-003)`, async ({ page }) => {
        const { totals, ranking } = expectedFor(code)
        await page.goto(`/states/${code}`)
        await expect(page.locator('[data-indicator="population"]')).toHaveText(
            integer.format(totals.population),
        )
        await expect(page.locator('[data-indicator="area"]')).toContainText(
            decimal2.format(totals.area),
        )
        await expect(page.locator('[data-indicator="density"]')).toContainText(
            decimal2.format(totals.population / totals.area),
        )
        await expect(page.locator('[data-ranking] tbody tr th')).toHaveText(ranking)
    })
}
