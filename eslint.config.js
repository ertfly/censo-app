import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import prettier from 'eslint-config-prettier'
import boundaries from 'eslint-plugin-boundaries'
import pluginVue from 'eslint-plugin-vue'

const FRONTEND_LAYERS = ['fe-app', 'fe-page', 'fe-widget', 'fe-feature', 'fe-entity', 'fe-shared']

// Camadas acima de cada camada do frontend (FSD, ADR 0014): não podem ser importadas por ela.
const FRONTEND_UPPER_LAYERS = {
    'fe-page': ['fe-app'],
    'fe-widget': ['fe-app', 'fe-page'],
    'fe-feature': ['fe-app', 'fe-page', 'fe-widget'],
    'fe-entity': ['fe-app', 'fe-page', 'fe-widget', 'fe-feature'],
    'fe-shared': ['fe-app', 'fe-page', 'fe-widget', 'fe-feature', 'fe-entity'],
}

const frontendLayerPolicies = Object.entries(FRONTEND_UPPER_LAYERS).map(([layer, upper]) => ({
    from: { element: { type: layer } },
    disallow: { to: { element: { types: { anyOf: upper } } } },
}))

// Slices da mesma camada não se importam (imports dentro da própria slice são internos e liberados).
const frontendSlicePolicies = ['fe-page', 'fe-widget', 'fe-feature', 'fe-entity'].map((layer) => ({
    from: { element: { type: layer } },
    disallow: { to: { element: { type: layer } } },
}))

export default defineConfigWithVueTs(
    {
        ignores: [
            '**/dist/**',
            '**/node_modules/**',
            '**/coverage/**',
            '**/playwright-report/**',
            '**/test-results/**',
            'e2e/.tmp/**',
        ],
    },
    pluginVue.configs['flat/recommended'],
    vueTsConfigs.recommended,
    {
        files: [
            'backend/src/**/*.ts',
            'packages/contracts/src/**/*.ts',
            'frontend/src/**/*.{ts,vue}',
        ],
        plugins: { boundaries },
        settings: {
            'import/resolver': {
                typescript: {
                    // frontend/tsconfig.lint.json só existe para o resolvedor: ele não resolve
                    // `paths` sem `baseUrl`, e o `baseUrl` está depreciado no TypeScript 6.
                    project: [
                        'backend/tsconfig.json',
                        'frontend/tsconfig.lint.json',
                        'packages/contracts/tsconfig.json',
                    ],
                    noWarnOnMultipleProjects: true,
                    conditionNames: ['development', 'types', 'import', 'default'],
                },
            },
            'boundaries/root-path': import.meta.dirname,
            'boundaries/elements': [
                { type: 'be-domain', pattern: 'backend/src/domain/**', partialMatch: false },
                {
                    type: 'be-application',
                    pattern: 'backend/src/application/**',
                    partialMatch: false,
                },
                { type: 'be-infra', pattern: 'backend/src/infra/**', partialMatch: false },
                { type: 'contracts', pattern: 'packages/contracts/**', partialMatch: false },
                { type: 'fe-app', pattern: 'frontend/src/app/**', partialMatch: false },
                {
                    type: 'fe-page',
                    pattern: 'frontend/src/pages/*/**',
                    partialMatch: false,
                    capture: ['slice'],
                },
                {
                    type: 'fe-widget',
                    pattern: 'frontend/src/widgets/*/**',
                    partialMatch: false,
                    capture: ['slice'],
                },
                {
                    type: 'fe-feature',
                    pattern: 'frontend/src/features/*/**',
                    partialMatch: false,
                    capture: ['slice'],
                },
                {
                    type: 'fe-entity',
                    pattern: 'frontend/src/entities/*/**',
                    partialMatch: false,
                    capture: ['slice'],
                },
                { type: 'fe-shared', pattern: 'frontend/src/shared/**', partialMatch: false },
            ],
        },
        rules: {
            'boundaries/dependencies': [
                2,
                {
                    default: 'allow',
                    // Verifica também pacotes externos e módulos nativos do Node.
                    checkAllOrigins: true,
                    policies: [
                        // Backend (ADR 0008, 0011, 0013)
                        {
                            from: { element: { type: 'be-domain' } },
                            disallow: {
                                to: {
                                    element: {
                                        types: {
                                            anyOf: ['be-application', 'be-infra', 'contracts'],
                                        },
                                    },
                                },
                            },
                        },
                        {
                            from: { element: { type: 'be-domain' } },
                            disallow: { to: { module: { origin: 'external' } } },
                        },
                        {
                            from: { element: { type: 'be-domain' } },
                            disallow: { to: { module: { origin: 'core' } } },
                        },
                        {
                            from: { element: { type: 'be-application' } },
                            disallow: {
                                to: { element: { types: { anyOf: ['be-infra'] } } },
                            },
                        },
                        {
                            from: { element: { type: 'be-application' } },
                            disallow: {
                                to: {
                                    module: {
                                        origin: 'external',
                                        source: '!{typebox,@censo/contracts}',
                                    },
                                },
                            },
                        },
                        {
                            from: { element: { type: 'contracts' } },
                            disallow: {
                                to: { module: { origin: 'external', source: '!typebox' } },
                            },
                        },
                        {
                            from: { element: { type: 'contracts' } },
                            disallow: {
                                to: {
                                    element: {
                                        types: {
                                            anyOf: [
                                                'be-domain',
                                                'be-application',
                                                'be-infra',
                                                ...FRONTEND_LAYERS,
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                        // Frontend (ADR 0014)
                        ...frontendLayerPolicies,
                        ...frontendSlicePolicies,
                        {
                            from: { element: { types: { anyOf: FRONTEND_LAYERS } } },
                            disallow: {
                                to: {
                                    element: {
                                        types: {
                                            anyOf: ['be-domain', 'be-application', 'be-infra'],
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
            ],
        },
    },
    {
        // Componentes copiados do shadcn-vue: mantêm os nomes e props do projeto de origem.
        files: ['frontend/src/shared/ui/**/*.vue'],
        rules: {
            'vue/multi-word-component-names': 'off',
            'vue/require-default-prop': 'off',
        },
    },
    prettier,
)
