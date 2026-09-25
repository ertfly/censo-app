import { describe, expect, it } from 'vitest'
import { accessKey } from '#infra/http/protection/access-key.js'

describe('accessKey', () => {
    it('keeps an IPv4 address whole', () => {
        expect(accessKey('203.0.113.9')).toBe('203.0.113.9')
    })

    it('treats an IPv4-mapped IPv6 address as IPv4', () => {
        expect(accessKey('::ffff:203.0.113.9')).toBe('203.0.113.9')
    })

    it('reduces IPv6 to its /64 prefix', () => {
        expect(accessKey('2001:db8:1:2:aaaa:bbbb:cccc:dddd')).toBe('2001:db8:1:2::/64')
    })

    it('gives the same key to addresses in the same /64', () => {
        expect(accessKey('2001:db8:1:2::1')).toBe(accessKey('2001:db8:1:2:ffff::9'))
    })

    it('gives different keys to different /64 blocks', () => {
        expect(accessKey('2001:db8:1:2::1')).not.toBe(accessKey('2001:db8:1:3::1'))
    })

    it('normalizes compressed and uppercase IPv6', () => {
        expect(accessKey('2001:DB8:0:0::1')).toBe('2001:db8:0:0::/64')
        expect(accessKey('::1')).toBe('0:0:0:0::/64')
    })

    it('ignores the zone id', () => {
        expect(accessKey('fe80::1%eth0')).toBe('fe80:0:0:0::/64')
    })

    it('keeps an unrecognized value as is', () => {
        expect(accessKey('unknown')).toBe('unknown')
    })
})
