import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import SQLite from 'better-sqlite3'
import { describe, expect, it } from 'vitest'
import { checkDatabaseFile, DatabaseFileError } from '#infra/database/database-file-check.js'

const dir = mkdtempSync(join(tmpdir(), 'db-check-'))

describe('checkDatabaseFile', () => {
    it('accepts a valid SQLite file', () => {
        const path = join(dir, 'valid.sqlite')
        new SQLite(path).exec('CREATE TABLE t (id INTEGER)')
        expect(() => checkDatabaseFile(path)).not.toThrow()
    })

    it('rejects a Git LFS pointer and explains how to fix it', () => {
        const path = join(dir, 'pointer.sqlite')
        writeFileSync(
            path,
            'version https://git-lfs.github.com/spec/v1\noid sha256:abc\nsize 35196928\n',
        )
        expect(() => checkDatabaseFile(path)).toThrow(DatabaseFileError)
        expect(() => checkDatabaseFile(path)).toThrow(/git lfs pull/)
    })

    it('rejects a file that is not SQLite', () => {
        const path = join(dir, 'text.sqlite')
        writeFileSync(path, 'not a database')
        expect(() => checkDatabaseFile(path)).toThrow(/not a SQLite database/)
    })

    it('rejects a missing file', () => {
        expect(() => checkDatabaseFile(join(dir, 'missing.sqlite'))).toThrow(/not found/)
    })
})
