// Tipos das tabelas do censo.sqlite para o Kysely. Os nomes em português ficam
// restritos a infra/database (conventions.md); o schema está em .harness/database.md.

export interface UfTable {
    cd_uf: string
    nm_uf: string
}

export interface MunicipioTable {
    cd_mun: string
    nm_mun: string
    cd_uf: string
}

export interface SetorTable {
    cd_setor: string
    cd_mun: string
    situacao: string | null
    area_km2: number | null
    populacao: number | null
}

export interface DemografiaTable {
    cd_setor: string
    moradores: number | null
    homens: number | null
    mulheres: number | null
}

export interface Database {
    uf: UfTable
    municipio: MunicipioTable
    setor: SetorTable
    demografia: DemografiaTable
}
