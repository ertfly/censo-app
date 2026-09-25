// Assinaturas de desafios já usados, para a mesma solução não abrir duas sessões
// (research R1 da 003). Em memória: uma instância do backend (ADR 0017).

export interface UsedChallengeStoreOptions {
    maxEntries: number
    now: () => number
}

export class UsedChallengeStore {
    // Map preserva a ordem de inserção: as primeiras entradas são as mais antigas.
    private readonly entries = new Map<string, number>()

    constructor(private readonly options: UsedChallengeStoreOptions) {}

    get size(): number {
        this.purgeExpired()
        return this.entries.size
    }

    isUsed(signature: string): boolean {
        this.purgeExpired()
        return this.entries.has(signature)
    }

    // Devolve false se a assinatura já tinha sido usada e ainda não expirou.
    markUsed(signature: string, expiresAtMs: number): boolean {
        if (this.isUsed(signature)) {
            return false
        }
        this.entries.set(signature, expiresAtMs)
        while (this.entries.size > this.options.maxEntries) {
            const oldest = this.entries.keys().next().value
            if (oldest === undefined) {
                break
            }
            this.entries.delete(oldest)
        }
        return true
    }

    private purgeExpired(): void {
        const now = this.options.now()
        for (const [signature, expiresAtMs] of this.entries) {
            if (expiresAtMs < now) {
                this.entries.delete(signature)
            }
        }
    }
}
