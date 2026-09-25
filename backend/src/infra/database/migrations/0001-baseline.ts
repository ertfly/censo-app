import { type Kysely, sql } from 'kysely'

// Base do schema entregue (ADR 0015). No censo.sqlite as tabelas já existem e nada
// muda; nos bancos de teste em memória, o schema é criado do zero.

export async function up(db: Kysely<unknown>): Promise<void> {
    await sql`
        CREATE TABLE IF NOT EXISTS uf(
            cd_uf TEXT PRIMARY KEY,
            nm_uf TEXT NOT NULL
        ) WITHOUT ROWID
    `.execute(db)

    await sql`
        CREATE TABLE IF NOT EXISTS municipio(
            cd_mun TEXT PRIMARY KEY,
            nm_mun TEXT NOT NULL,
            cd_uf  TEXT NOT NULL REFERENCES uf(cd_uf)
        ) WITHOUT ROWID
    `.execute(db)

    await sql`
        CREATE TABLE IF NOT EXISTS setor(
            cd_setor  TEXT PRIMARY KEY,
            cd_mun    TEXT NOT NULL REFERENCES municipio(cd_mun),
            situacao  TEXT,
            area_km2  REAL,
            populacao INTEGER
        ) WITHOUT ROWID
    `.execute(db)

    await sql`
        CREATE TABLE IF NOT EXISTS demografia(
            cd_setor  TEXT PRIMARY KEY REFERENCES setor(cd_setor),
            moradores INTEGER,
            homens    INTEGER,
            mulheres  INTEGER
        ) WITHOUT ROWID
    `.execute(db)
}

export async function down(): Promise<void> {
    throw new Error('The baseline migration cannot be reverted: it would delete the census data.')
}
