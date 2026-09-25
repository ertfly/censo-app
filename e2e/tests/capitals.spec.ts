import { expect, test } from '@playwright/test'

// SC-001: em pelo menos 25 das 27 capitais, a capital aparece nas sugestões com
// até 5 caracteres do início do nome. SC-002 e SC-003: sugestões e indicadores
// em até 1 s (a espera de 250 ms entre teclas está incluída na medida).

const CAPITALS = [
    'Rio Branco/AC',
    'Maceió/AL',
    'Macapá/AP',
    'Manaus/AM',
    'Salvador/BA',
    'Fortaleza/CE',
    'Brasília/DF',
    'Vitória/ES',
    'Goiânia/GO',
    'São Luís/MA',
    'Cuiabá/MT',
    'Campo Grande/MS',
    'Belo Horizonte/MG',
    'Belém/PA',
    'João Pessoa/PB',
    'Curitiba/PR',
    'Recife/PE',
    'Teresina/PI',
    'Rio de Janeiro/RJ',
    'Natal/RN',
    'Porto Alegre/RS',
    'Porto Velho/RO',
    'Boa Vista/RR',
    'Florianópolis/SC',
    'São Paulo/SP',
    'Aracaju/SE',
    'Palmas/TO',
]

const LIMIT_MS = 1000

test('finds the capitals with up to 5 characters, quickly (SC-001 to SC-003)', async ({ page }) => {
    test.setTimeout(120_000)
    await page.goto('/municipalities')
    const field = page.getByRole('combobox', { name: 'Município' })
    await expect(field).not.toHaveAttribute('aria-disabled', 'true', { timeout: 5000 })

    const missing: string[] = []
    const suggestionTimes: number[] = []
    const indicatorTimes: number[] = []

    for (const capital of CAPITALS) {
        const name = capital.slice(0, capital.lastIndexOf('/'))
        const prefix = name.slice(0, 5)

        const typedAt = Date.now()
        await field.fill(prefix)
        const listbox = page.getByRole('listbox')
        await expect(listbox).toBeVisible()
        await expect(listbox).not.toContainText('Buscando municípios', { timeout: 5000 })
        suggestionTimes.push(Date.now() - typedAt)

        const option = page.getByRole('option', { name: capital, exact: true })
        if ((await option.count()) === 0) {
            missing.push(`${capital} ("${prefix}")`)
            continue
        }

        const chosenAt = Date.now()
        await option.click()
        await expect(page.getByRole('heading', { level: 2 })).toHaveText(capital, {
            timeout: 5000,
        })
        await expect(page.locator('[data-indicator="population"]')).toBeVisible()
        indicatorTimes.push(Date.now() - chosenAt)
    }

    const slowest = (times: number[]) => Math.max(...times)
    test.info().annotations.push(
        {
            type: 'SC-001',
            description: `${CAPITALS.length - missing.length}/27; faltam: ${missing.join(', ') || 'nenhuma'}`,
        },
        { type: 'SC-002', description: `sugestões: pior ${slowest(suggestionTimes)} ms` },
        { type: 'SC-003', description: `indicadores: pior ${slowest(indicatorTimes)} ms` },
    )
    console.log(
        test
            .info()
            .annotations.map((item) => `${item.type}: ${item.description}`)
            .join('\n'),
    )

    expect(CAPITALS.length - missing.length).toBeGreaterThanOrEqual(25)
    expect(slowest(suggestionTimes)).toBeLessThanOrEqual(LIMIT_MS)
    expect(slowest(indicatorTimes)).toBeLessThanOrEqual(LIMIT_MS)
})
