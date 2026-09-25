import { isIPv4, isIPv6 } from 'node:net'

// Chave que identifica um acesso para o limite de consultas (research R4 da 003):
// IPv4 completo; IPv6 reduzido ao /64, já que um mesmo cliente costuma controlar
// o bloco inteiro.

function expandIPv6(address: string): string[] {
    const [head = '', tail = ''] = address.split('::')
    const headGroups = head ? head.split(':') : []
    const tailGroups = tail ? tail.split(':') : []
    const missing = address.includes('::') ? 8 - headGroups.length - tailGroups.length : 0
    return [...headGroups, ...Array<string>(missing).fill('0'), ...tailGroups]
}

export function accessKey(address: string): string {
    const withoutZone = address.split('%')[0] ?? address
    const lower = withoutZone.toLowerCase()

    const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(lower)
    if (mapped?.[1]) {
        return mapped[1]
    }
    if (isIPv4(lower)) {
        return lower
    }
    if (isIPv6(lower)) {
        const prefix = expandIPv6(lower)
            .slice(0, 4)
            .map((group) => Number.parseInt(group, 16).toString(16))
        return `${prefix.join(':')}::/64`
    }
    return address
}
