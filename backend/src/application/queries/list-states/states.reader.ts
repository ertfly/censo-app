import type { StateSummary } from '@censo/contracts'

export type { StateSummary }

// Porta de leitura da lista de UFs (ADR 0008).
export interface StatesReader {
    listAll(): Promise<StateSummary[]>
}
