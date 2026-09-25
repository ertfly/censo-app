import type { Kysely } from 'kysely'
import type {
    Database,
    DemografiaTable,
    MunicipioTable,
    SetorTable,
    UfTable,
} from '#infra/database/database.types.js'

// Dados mínimos com os casos de borda de .harness/database.md: nomes repetidos,
// setor sem situação, setor sem demografia, sexo ausente e o registro "." do RS.
// Códigos no formato real (setor começa com o município, que começa com a UF);
// valores inventados.

export const UFS: UfTable[] = [
    { cd_uf: '15', nm_uf: 'Pará' },
    { cd_uf: '17', nm_uf: 'Tocantins' },
    { cd_uf: '22', nm_uf: 'Piauí' },
    { cd_uf: '25', nm_uf: 'Paraíba' },
    { cd_uf: '29', nm_uf: 'Bahia' },
    { cd_uf: '35', nm_uf: 'São Paulo' },
    { cd_uf: '43', nm_uf: 'Rio Grande do Sul' },
    { cd_uf: '53', nm_uf: 'Distrito Federal' },
]

export const MUNICIPIOS: MunicipioTable[] = [
    { cd_mun: '1500001', nm_mun: "Pau D'Arco", cd_uf: '15' },
    { cd_mun: '1700001', nm_mun: "Pau D'Arco", cd_uf: '17' },
    { cd_mun: '2200001', nm_mun: 'Bom Jesus', cd_uf: '22' },
    { cd_mun: '2500001', nm_mun: 'Bom Jesus', cd_uf: '25' },
    { cd_mun: '2900001', nm_mun: 'Paulo Afonso', cd_uf: '29' },
    { cd_mun: '3550308', nm_mun: 'São Paulo', cd_uf: '35' },
    { cd_mun: '4314902', nm_mun: 'Porto Alegre', cd_uf: '43' },
    { cd_mun: '.', nm_mun: '', cd_uf: '43' },
    { cd_mun: '5300108', nm_mun: 'Brasília', cd_uf: '53' },
]

export const SETORES: SetorTable[] = [
    // São Paulo: urbano, rural com sexo ausente e setor sem situação e sem população
    {
        cd_setor: '355030800000001',
        cd_mun: '3550308',
        situacao: 'Urbana',
        area_km2: 0.5,
        populacao: 1000,
    },
    {
        cd_setor: '355030800000002',
        cd_mun: '3550308',
        situacao: 'Rural',
        area_km2: 10,
        populacao: 200,
    },
    { cd_setor: '355030800000003', cd_mun: '3550308', situacao: null, area_km2: 0.2, populacao: 0 },
    {
        cd_setor: '220000100000001',
        cd_mun: '2200001',
        situacao: 'Urbana',
        area_km2: 2,
        populacao: 50,
    },
    {
        cd_setor: '250000100000001',
        cd_mun: '2500001',
        situacao: 'Rural',
        area_km2: 4,
        populacao: 80,
    },
    {
        cd_setor: '150000100000001',
        cd_mun: '1500001',
        situacao: 'Rural',
        area_km2: 30,
        populacao: 60,
    },
    {
        cd_setor: '170000100000001',
        cd_mun: '1700001',
        situacao: 'Rural',
        area_km2: 25,
        populacao: 40,
    },
    {
        cd_setor: '290000100000001',
        cd_mun: '2900001',
        situacao: 'Urbana',
        area_km2: 5,
        populacao: 500,
    },
    {
        cd_setor: '431490200000001',
        cd_mun: '4314902',
        situacao: 'Urbana',
        area_km2: 3,
        populacao: 900,
    },
    // Registro "." do RS: setores sem população, com área (fora dos municípios)
    {
        cd_setor: '430000100000000',
        cd_mun: '.',
        situacao: null,
        area_km2: 2884.3399222,
        populacao: 0,
    },
    {
        cd_setor: '430000200000000',
        cd_mun: '.',
        situacao: null,
        area_km2: 10201.5241788,
        populacao: 0,
    },
    {
        cd_setor: '530010800000001',
        cd_mun: '5300108',
        situacao: 'Urbana',
        area_km2: 1,
        populacao: 700,
    },
    {
        cd_setor: '530010800000002',
        cd_mun: '5300108',
        situacao: 'Rural',
        area_km2: 9,
        populacao: 100,
    },
]

export const DEMOGRAFIAS: DemografiaTable[] = [
    { cd_setor: '355030800000001', moradores: 1000, homens: 490, mulheres: 510 },
    // Sigilo na origem: moradores e sexo ausentes
    { cd_setor: '355030800000002', moradores: null, homens: null, mulheres: null },
    { cd_setor: '220000100000001', moradores: 50, homens: 25, mulheres: 25 },
    { cd_setor: '250000100000001', moradores: 80, homens: 41, mulheres: 39 },
    { cd_setor: '150000100000001', moradores: 60, homens: 30, mulheres: 30 },
    { cd_setor: '170000100000001', moradores: 40, homens: 20, mulheres: 20 },
    { cd_setor: '290000100000001', moradores: 500, homens: 240, mulheres: 260 },
    { cd_setor: '431490200000001', moradores: 900, homens: 430, mulheres: 470 },
    // Sexo parcialmente ausente
    { cd_setor: '530010800000001', moradores: 700, homens: 340, mulheres: null },
    { cd_setor: '530010800000002', moradores: 100, homens: 50, mulheres: 50 },
]

export async function insertCensusFixture(db: Kysely<Database>): Promise<void> {
    await db.insertInto('uf').values(UFS).execute()
    await db.insertInto('municipio').values(MUNICIPIOS).execute()
    await db.insertInto('setor').values(SETORES).execute()
    await db.insertInto('demografia').values(DEMOGRAFIAS).execute()
}
