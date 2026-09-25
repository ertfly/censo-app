import { closeSync, openSync, readSync } from 'node:fs'

const SQLITE_HEADER = 'SQLite format 3\0'
const LFS_POINTER_PREFIX = 'version https://git-lfs'

export class DatabaseFileError extends Error {}

// Confere o arquivo antes de abrir: clonar sem Git LFS deixa um ponteiro de texto
// no lugar do banco (ADR 0005).
export function checkDatabaseFile(path: string): void {
    let descriptor: number
    try {
        descriptor = openSync(path, 'r')
    } catch {
        throw new DatabaseFileError(`Database file not found: ${path}`)
    }

    const buffer = Buffer.alloc(32)
    const bytesRead = readSync(descriptor, buffer, 0, buffer.length, 0)
    closeSync(descriptor)
    const header = buffer.subarray(0, bytesRead).toString('latin1')

    if (header.startsWith(LFS_POINTER_PREFIX)) {
        throw new DatabaseFileError(
            `${path} is a Git LFS pointer, not the database. ` +
                'Install Git LFS and run "git lfs pull" in the repository to download it.',
        )
    }
    if (!header.startsWith(SQLITE_HEADER)) {
        throw new DatabaseFileError(`${path} is not a SQLite database.`)
    }
}
