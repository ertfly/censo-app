import type { ListStatesResponse } from '@censo/contracts'
import type { StatesReader } from './states.reader.js'

// Lista das UFs para a seleção (spec 002 FR-001).
export class ListStatesHandler {
    constructor(private readonly reader: StatesReader) {}

    async execute(): Promise<ListStatesResponse> {
        return { items: await this.reader.listAll() }
    }
}
