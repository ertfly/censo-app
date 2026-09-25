// Relógio injetável: os testes simulam expiração sem esperar.
export interface Clock {
    now(): number
}

export const systemClock: Clock = { now: () => Date.now() }
