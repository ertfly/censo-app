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
        files: ['backend/src/**/*.ts', 'packages/contracts/src/**/*.ts', 'frontend/src/**/*.{ts,vue}'],
        plugins: { boundaries },
        settings: {
            'import/resolver': {
                typescript: {
                    project: [
                        'backend/tsconfig.json',
                        'frontend/tsconfig.json',
                        'packages/contracts/tsconfig.json',
                    ],
                    conditionNames: ['development', 'types', 'import', 'default'],
                },
            },
            'boundaries/root-path': import.meta.dirname,
            'boundaries/elements': [
                { type: 'be-domain', pattern: 'backend/src/domain/**', mode: 'full' },
                { type: 'be-application', pattern: 'backend/src/application/**', mode: 'full' },
                { type: 'be-infra', pattern: 'backend/src/infra/**', mode: 'full' },
                { type: 'be-main', pattern: 'backend/src/main.ts', mode: 'full' },
                { type: 'contracts', pattern: 'packages/contracts/**', mode: 'full' },
                { type: 'fe-app', pattern: 'frontend/src/app/**', mode: 'full' },
                {
                    type: 'fe-page',
                    pattern: 'frontend/src/pages/*/**',
                    mode: 'full',
                    capture: ['slice'],
                },
                {
                    type: 'fe-widget',
                    pattern: 'frontend/src/widgets/*/**',
                    mode: 'full',
                    capture: ['slice'],
                },
                {
                    type: 'fe-feature',
                    pattern: 'frontend/src/features/*/**',
                    mode: 'full',
                    capture: ['slice'],
                },
                {
                    type: 'fe-entity',
                    pattern: 'frontend/src/entities/*/**',
                    mode: 'full',
                    capture: ['slice'],
                },
                { type: 'fe-shared', pattern: 'frontend/src/shared/**', mode: 'full' },
            ],
        },
        rules: {
            'boundaries/dependencies': [
                2,
                {
                    default: 'allow',
                    policies: [
                        // Backend (ADR 0008, 0011, 0013)
                        {
                            from: { element: { type: 'be-domain' } },
                            disallow: {
                                to: {
                                    element: {
                                        types: {
                                            anyOf: ['be-application', 'be-infra', 'be-main', 'contracts'],
                                        },
                                    },
                                },
                            },
                        },
                        {
                            from: { element: { type: 'be-domain' } },
                            disallow: { to: { module: { origin: { anyOf: ['external', 'core'] } } } },
                        },
                        {
                            from: { element: { type: 'be-application' } },
                            disallow: { to: { element: { types: { anyOf: ['be-infra', 'be-main'] } } } },
                        },
                        {
                            from: { element: { type: 'be-application' } },
                            disallow: {
                                to: { module: { origin: 'external', source: '!{typebox,@censo/contracts}' } },
                            },
                        },
                        {
                            from: { element: { type: 'be-infra' } },
                            disallow: { to: { element: { type: 'be-main' } } },
                        },
                        {
                            from: { element: { type: 'contracts' } },
                            disallow: { to: { module: { origin: 'external', source: '!typebox' } } },
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
                                                'be-main',
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
                                            anyOf: ['be-domain', 'be-application', 'be-infra', 'be-main'],
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
    prettier,
)
