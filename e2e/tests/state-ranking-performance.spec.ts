import Database from 'better-sqlite3'
import { expect, test } from '@playwright/test'

// SC-001: ranking e totais de MG em até 1 s após a escolha. SC-004: achar a
// posição de 5 municípios de MG sorteados usando o filtro, cada um em até 30 s.

function randomMunicipalities(count: number): string[] {
    const db = new Database(process.env.E2E_DATABASE_PATH ?? '.tmp/censo.sqlite', {
        readonly: true,
    })
    try {
        return (
            db
                .prepare(
                    `SELECT nm_mun FROM municipio WHERE cd_uf = '31' AND nm_mun <> ''
                     ORDER BY RANDOM() LIMIT ?`,
                )
                .all(count) as { nm_mun: string }[]
        ).map((row) => row.nm_mun)
    } finally {
        db.close()
    }
}

test('shows Minas Gerais and finds municipalities quickly (SC-001, SC-004)', async ({ page }) => {
    await page.goto('/states')
    const select = page.getByRole('combobox', { name: 'Unidade federativa' })
    await expect(select).not.toHaveAttribute('aria-disabled', 'true', { timeout: 5000 })

    await select.click()
    const chosenAt = Date.now()
    await page.getByRole('option', { name: 'Minas Gerais/MG', exact: true }).click()
    await expect(page.locator('[data-indicator="population"]')).toBeVisible()
    await expect(page.locator('[data-ranking] tbody tr')).toHaveCount(853)
    const rankingTime = Date.now() - chosenAt

    const filter = page.getByRole('textbox', { name: 'Filtrar municípios' })
    const findTimes: number[] = []
    for (const name of randomMunicipalities(5)) {
        const startedAt = Date.now()
        await filter.fill(name.slice(0, 6))
        const row = page.locator('[data-ranking] tbody tr').filter({
            has: page.getByRole('rowheader', { name, exact: true }),
        })
        await expect(row.first().locator('[data-position]')).toHaveText(/\d/)
        findTimes.push(Date.now() - startedAt)
    }

    test.info().annotations.push(
        { type: 'SC-001', description: `ranking e totais de MG: ${rankingTime} ms` },
        { type: 'SC-004', description: `posição pelo filtro: pior ${Math.max(...findTimes)} ms` },
    )
    console.log(
        test
            .info()
            .annotations.map((item) => `${item.type}: ${item.description}`)
            .join('\n'),
    )

    expect(rankingTime).toBeLessThanOrEqual(1000)
    expect(Math.max(...findTimes)).toBeLessThanOrEqual(30_000)
})
