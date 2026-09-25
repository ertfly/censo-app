// Carrega o web component do ALTCHA e os textos em pt-BR só no navegador
// (spec 003, research R6).
export async function loadAltcha(): Promise<void> {
    await import('altcha')
    await import('altcha/i18n/pt-br')
}
