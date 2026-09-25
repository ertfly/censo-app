import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

// URLs em inglês (conventions.md); o endereço principal abre a "Busca de cidades"
// (spec 001 FR-019).
export const routes: RouteRecordRaw[] = [
    { path: '/', redirect: '/municipalities' },
    {
        path: '/municipalities/:municipalityCode?',
        name: 'municipality-search',
        component: () =>
            import('@/pages/municipality-search').then((page) => page.MunicipalitySearchPage),
    },
    {
        path: '/states/:stateCode?',
        name: 'state-ranking',
        component: () => import('@/pages/state-ranking').then((page) => page.StateRankingPage),
    },
    { path: '/:pathMatch(.*)*', redirect: '/municipalities' },
]

export function createAppRouter() {
    return createRouter({ history: createWebHistory(), routes })
}
