import { defineConfig, lazyPlugins } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';

// https://vite.dev/config/
export default defineConfig({
    // Relative URLs, so the build runs wherever it's served from: a domain root, a subpath such as
    // GitHub Pages or itch.io, or a Snapchat Web Lens
    base: './',
    build: {
        // A PlayCanvas build is 1-2.5 MB minified (300-600 kB gzipped), nearly all of it engine code the
        // First frame needs, so warn only for chunks well past that rather than at Vite's 500 kB default
        chunkSizeWarningLimit: 3000
    },
    fmt: {
        ignorePatterns: ['.agents', 'public/ammo', 'coverage'],
        printWidth: 120,
        singleQuote: true,
        sortPackageJson: true,
        tabWidth: 4,
        trailingComma: 'none'
    },
    lint: {
        categories: {
            correctness: 'error',
            nursery: 'error',
            pedantic: 'error',
            perf: 'error',
            restriction: 'error',
            style: 'error',
            suspicious: 'error'
        },
        env: {
            builtin: true
        },
        ignorePatterns: ['.agents', 'public/ammo', 'coverage', '**/node_modules', '**/dist'],
        jsPlugins: [
            {
                name: 'vite-plus',
                specifier: 'vite-plus/oxlint-plugin'
            }
        ],
        options: {
            denyWarnings: true,
            typeAware: true,
            typeCheck: true
        },
        overrides: [
            {
                files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
                rules: {
                    'constructor-super': 'off',
                    'getter-return': 'off',
                    'no-class-assign': 'off',
                    'no-const-assign': 'off',
                    'no-dupe-class-members': 'off',
                    'no-dupe-keys': 'off',
                    'no-func-assign': 'off',
                    'no-import-assign': 'off',
                    'no-new-native-nonconstructor': 'off',
                    'no-obj-calls': 'off',
                    'no-redeclare': 'off',
                    'no-setter-return': 'off',
                    'no-this-before-super': 'off',
                    'no-undef': 'off',
                    'no-unreachable': 'off',
                    'no-unsafe-negation': 'off',
                    'no-var': 'error',
                    'no-with': 'off',
                    'prefer-const': 'error',
                    'prefer-rest-params': 'error',
                    'prefer-spread': 'error'
                }
            },
            {
                env: {
                    es2022: true,
                    node: true
                },
                files: ['**/*.{js,mjs,cjs,ts,tsx,mts,cts}'],
                globals: {
                    AsyncDisposableStack: 'readonly',
                    DisposableStack: 'readonly',
                    SuppressedError: 'readonly'
                },
                rules: {
                    // Allow `import type` next to a value import of the same module
                    'no-duplicate-imports': ['error', { allowSeparateTypeImports: true }],
                    // Separate declarations read better than one merged `const` per scope
                    'one-var': ['error', 'never'],
                    'typescript/consistent-type-imports': 'error',
                    'typescript/no-dynamic-delete': 'off',
                    'typescript/no-non-null-assertion': 'off',
                    'typescript/prefer-for-of': 'off'
                }
            },
            {
                files: ['src/main.ts', 'src/inspector.ts', '**/*.dom.test.ts'],
                rules: {
                    // 🚫 Side-effect imports (CSS) are idiomatic in Vite apps
                    'import/no-unassigned-import': 'off'
                }
            },
            {
                files: ['src/inspector.ts'],
                rules: {
                    // 🚫 Class instances (AppBase, Entity) cannot be expressed as readonly types
                    'typescript/prefer-readonly-parameter-types': 'off'
                }
            },
            {
                env: {
                    mocha: true
                },
                files: ['**/test/**', '**/tests/**', '**/__tests__/**', '**/*.{test,spec}.{js,mjs,cjs,ts,tsx,mts,cts}'],
                rules: {
                    // 🚫 Fixtures and expectations read better as literals than named constants
                    'no-magic-numbers': 'off',
                    'no-unused-expressions': 'off'
                }
            },
            {
                files: ['**/package.json', '**/package-lock.json'],
                jsPlugins: [],
                rules: {}
            },
            {
                files: ['**/*.d.ts'],
                rules: {
                    // 🚫 Ambient declarations describe other modules, not an entry point of this file
                    'import/group-exports': 'off',
                    'import/no-named-export': 'off',
                    'import/unambiguous': 'off'
                }
            },
            {
                files: ['vite.config.ts'],
                rules: {
                    // 🚫 Vite resolves the config through its default export
                    'import/no-default-export': 'off',
                    // 🚫 One config block per tool naturally grows past the default limit
                    'max-lines': 'off',
                    // 🚫 Plugin hook shapes come from vite-plus' defineConfig; inference reads better
                    'typescript/explicit-function-return-type': 'off'
                }
            }
        ],
        plugins: ['oxc', 'eslint', 'typescript', 'unicorn', 'import'],
        rules: {
            'constructor-super': 'error',
            // Preserved from @playcanvas/eslint-config: eslint-config-prettier disabled `curly`
            curly: 'off',
            'for-direction': 'error',
            'getter-return': 'error',
            'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
            'import/default': 'error',
            'import/export': 'error',
            'import/named': 'error',
            'import/namespace': 'error',
            'import/no-duplicates': 'warn',
            'import/no-named-as-default': 'warn',
            'import/no-named-as-default-member': 'warn',
            'no-array-constructor': 'error',
            'no-async-promise-executor': 'error',
            'no-case-declarations': 'error',
            'no-class-assign': 'error',
            'no-compare-neg-zero': 'error',
            'no-cond-assign': 'error',
            'no-const-assign': 'error',
            'no-constant-binary-expression': 'error',
            'no-constant-condition': 'error',
            'no-control-regex': 'error',
            'no-debugger': 'error',
            'no-delete-var': 'error',
            'no-dupe-class-members': 'error',
            'no-dupe-else-if': 'error',
            'no-dupe-keys': 'error',
            'no-duplicate-case': 'error',
            'no-empty': 'error',
            'no-empty-character-class': 'error',
            'no-empty-function': 'error',
            'no-empty-pattern': 'error',
            'no-empty-static-block': 'error',
            'no-ex-assign': 'error',
            'no-extra-boolean-cast': 'error',
            'no-fallthrough': 'error',
            'no-func-assign': 'error',
            'no-global-assign': 'error',
            'no-import-assign': 'error',
            'no-invalid-regexp': 'error',
            'no-irregular-whitespace': 'error',
            'no-loss-of-precision': 'error',
            'no-misleading-character-class': 'error',
            'no-new-native-nonconstructor': 'error',
            'no-nonoctal-decimal-escape': 'error',
            'no-obj-calls': 'error',
            'no-prototype-builtins': 'error',
            'no-redeclare': 'error',
            'no-regex-spaces': 'error',
            'no-self-assign': 'error',
            'no-setter-return': 'error',
            'no-shadow-restricted-names': 'error',
            'no-sparse-arrays': 'error',
            'no-this-before-super': 'error',
            'no-undef': 'error',
            'no-unexpected-multiline': 'error',
            'no-unreachable': 'error',
            'no-unsafe-finally': 'error',
            'no-unsafe-negation': 'error',
            'no-unsafe-optional-chaining': 'error',
            'no-unused-expressions': 'error',
            'no-unused-labels': 'error',
            'no-unused-private-class-members': 'error',
            // Preserved from @playcanvas/eslint-config: ignore intentionally unused names prefixed `_`
            'no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                    varsIgnorePattern: '^_'
                }
            ],
            'no-useless-backreference': 'error',
            'no-useless-catch': 'error',
            'no-useless-constructor': 'error',
            'no-useless-escape': 'error',
            'no-with': 'error',
            'oxc/no-optional-chaining': 'off',
            'require-yield': 'error',
            'sort-keys': [
                'error',
                'asc',
                {
                    caseSensitive: false,
                    natural: true
                }
            ],
            'typescript/adjacent-overload-signatures': 'error',
            'typescript/array-type': 'error',
            'typescript/ban-ts-comment': 'error',
            'typescript/ban-tslint-comment': 'error',
            'typescript/class-literal-property-style': 'error',
            'typescript/consistent-generic-constructors': 'error',
            'typescript/consistent-indexed-object-style': 'error',
            'typescript/consistent-type-assertions': 'error',
            // Preserved from @playcanvas/eslint-config (interfaces are needed for declaration merging)
            'typescript/consistent-type-definitions': 'off',
            'typescript/no-confusing-non-null-assertion': 'error',
            'typescript/no-duplicate-enum-values': 'error',
            'typescript/no-dynamic-delete': 'error',
            'typescript/no-empty-object-type': 'error',
            'typescript/no-explicit-any': 'error',
            'typescript/no-extra-non-null-assertion': 'error',
            'typescript/no-extraneous-class': 'error',
            'typescript/no-inferrable-types': 'error',
            // Preserved from @playcanvas/eslint-config (explicitly off there)
            'typescript/no-invalid-void-type': 'off',
            'typescript/no-misused-new': 'error',
            'typescript/no-namespace': 'error',
            'typescript/no-non-null-asserted-nullish-coalescing': 'error',
            'typescript/no-non-null-asserted-optional-chain': 'error',
            'typescript/no-non-null-assertion': 'error',
            'typescript/no-require-imports': 'error',
            'typescript/no-this-alias': 'error',
            'typescript/no-unnecessary-type-constraint': 'error',
            'typescript/no-unsafe-declaration-merging': 'error',
            'typescript/no-unsafe-function-type': 'error',
            'typescript/no-wrapper-object-types': 'error',
            'typescript/prefer-as-const': 'error',
            'typescript/prefer-for-of': 'error',
            'typescript/prefer-function-type': 'error',
            'typescript/prefer-literal-enum-member': 'error',
            'typescript/prefer-namespace-keyword': 'error',
            'typescript/triple-slash-reference': 'error',
            'typescript/unified-signatures': 'error',
            'use-isnan': 'error',
            'valid-typeof': 'error',
            'vite-plus/prefer-vite-plus-imports': 'error'
        },
        settings: {
            'import-x/resolver-next': [
                {
                    interfaceVersion: 3,
                    name: 'eslint-import-resolver-typescript'
                }
            ]
        }
    },
    plugins: lazyPlugins(() => [
        {
            // Dev only: install the PlayCanvas Inspector before the app starts (press ` to toggle)
            apply: 'serve',
            config: () => ({ optimizeDeps: { include: ['@playcanvas/inspector'] } }),
            name: 'playcanvas-inspector',
            transformIndexHtml: () => [
                {
                    attrs: { src: '/src/inspector.ts', type: 'module' },
                    injectTo: 'head-prepend',
                    tag: 'script'
                }
            ]
        }
    ]),
    staged: { '*': 'vp check --fix' },
    test: {
        browser: {
            enabled: true,
            headless: true,
            instances: [{ browser: 'chromium' }, { browser: 'firefox' }, { browser: 'webkit' }],
            // https://vitest.dev/guide/browser/playwright
            provider: playwright()
        },
        coverage: {
            exclude: ['**/*.d.ts', 'src/inspector.ts', 'src/main.ts'],
            include: ['src/**/*.ts'],
            // V8 coverage supports only one browser instance; istanbul works with all three
            provider: 'istanbul'
        },
        exclude: ['**/*.node.test.ts'],
        include: ['src/**/*.dom.test.ts'],
        isolate: true
    }
});
