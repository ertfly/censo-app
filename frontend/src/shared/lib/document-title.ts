const APP_NAME = 'Censo 2022'

// Título da aba: "São Paulo/SP - Censo 2022" (spec 001 FR-026, spec 002 FR-028).
export function setDocumentTitle(prefix?: string): void {
    document.title = prefix ? `${prefix} - ${APP_NAME}` : APP_NAME
}
