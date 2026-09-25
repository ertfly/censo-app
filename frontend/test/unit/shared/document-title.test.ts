import { describe, expect, it } from 'vitest'
import { setDocumentTitle } from '@/shared/lib/document-title'

describe('setDocumentTitle', () => {
    it('uses only the app name without a prefix', () => {
        setDocumentTitle()
        expect(document.title).toBe('Censo 2022')
    })

    it('puts the prefix before the app name', () => {
        setDocumentTitle('São Paulo/SP')
        expect(document.title).toBe('São Paulo/SP - Censo 2022')
    })
})
