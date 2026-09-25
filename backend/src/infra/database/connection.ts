import SQLite from 'better-sqlite3'
import { Kysely, SqliteDialect } from 'kysely'
import type { Database } from './database.types.js'

export interface ConnectionOptions {
    path: string
    // A aplicação abre sempre em modo leitura (ADR 0007); só o script de migration grava.
    readonly: boolean
}

export function createKysely(sqlite: SQLite.Database): Kysely<Database> {
    sqlite.pragma('foreign_keys = ON')
    return new Kysely<Database>({ dialect: new SqliteDialect({ database: sqlite }) })
}

export function openDatabase(options: ConnectionOptions): Kysely<Database> {
    const sqlite = new SQLite(options.path, {
        readonly: options.readonly,
        fileMustExist: true,
    })
    return createKysely(sqlite)
}
