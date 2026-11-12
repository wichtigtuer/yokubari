import { defineConfig, lazyPlugins } from 'vite-plus';

// https://vite.dev/config/
export default defineConfig({
    staged: {
        '*': 'vp check --fix'
    },
    lint: {
        plugins: ['oxc', 'typescript', 'unicorn', 'import'],
        categories: {
            correctness: 'warn'
        },
        env: {
            builtin: true
        },
        settings: {
            'import-x/resolver-next': [
                {
                    interfaceVersion: 3,
                    name: 'eslint-import-resolver-typescript'
                }
            ]
        },
        ignorePatterns: ['.claude', '.agents', 'public/ammo', '**/node_modules', '**/dist'],
        rules: {
            'constructor-super': 'error',
            'for-direction': 'error',
            'getter-return': 'error',
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
            'no-unused-labels': 'error',
            'no-unused-private-class-members': 'error',
            // Preserved from @playcanvas/eslint-config: ignore intentionally unused names prefixed `_`
            'no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_'
                }
            ],
            'no-useless-backreference': 'error',
            'no-useless-catch': 'error',
            'no-useless-escape': 'error',
            'no-with': 'error',
            'require-yield': 'error',
            'use-isnan': 'error',
            'valid-typeof': 'error',
            'no-array-constructor': 'error',
            'no-unused-expressions': 'error',
            'no-useless-constructor': 'error',
            'no-empty-function': 'error',
            // Preserved from @playcanvas/eslint-config: eslint-config-prettier disabled `curly`
            curly: 'off',
            'import/named': 'error',
            'import/namespace': 'error',
            'import/default': 'error',
            'import/export': 'error',
            'import/no-named-as-default': 'warn',
            'import/no-named-as-default-member': 'warn',
            'import/no-duplicates': 'warn',
            'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
            'typescript/ban-ts-comment': 'error',
            'typescript/no-duplicate-enum-values': 'error',
            'typescript/no-empty-object-type': 'error',
            'typescript/no-explicit-any': 'error',
            'typescript/no-extra-non-null-assertion': 'error',
            'typescript/no-misused-new': 'error',
            'typescript/no-namespace': 'error',
            'typescript/no-non-null-asserted-optional-chain': 'error',
            'typescript/no-require-imports': 'error',
            'typescript/no-this-alias': 'error',
            'typescript/no-unnecessary-type-constraint': 'error',
            'typescript/no-unsafe-declaration-merging': 'error',
            'typescript/no-unsafe-function-type': 'error',
            'typescript/no-wrapper-object-types': 'error',
            'typescript/prefer-as-const': 'error',
            'typescript/prefer-namespace-keyword': 'error',
            'typescript/triple-slash-reference': 'error',
            'typescript/no-dynamic-delete': 'error',
            'typescript/no-extraneous-class': 'error',
            // Preserved from @playcanvas/eslint-config (explicitly off there)
            'typescript/no-invalid-void-type': 'off',
            'typescript/no-non-null-asserted-nullish-coalescing': 'error',
            'typescript/no-non-null-assertion': 'error',
            'typescript/prefer-literal-enum-member': 'error',
            'typescript/unified-signatures': 'error',
            'typescript/adjacent-overload-signatures': 'error',
            'typescript/array-type': 'error',
            'typescript/ban-tslint-comment': 'error',
            'typescript/class-literal-property-style': 'error',
            'typescript/consistent-generic-constructors': 'error',
            'typescript/consistent-indexed-object-style': 'error',
            'typescript/consistent-type-assertions': 'error',
            // Preserved from @playcanvas/eslint-config (interfaces are needed for declaration merging)
            'typescript/consistent-type-definitions': 'off',
            'typescript/no-confusing-non-null-assertion': 'error',
            'typescript/no-inferrable-types': 'error',
            'typescript/prefer-for-of': 'error',
            'typescript/prefer-function-type': 'error',
            'vite-plus/prefer-vite-plus-imports': 'error'
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
                files: ['**/*.{js,mjs,cjs,ts,tsx,mts,cts}'],
                rules: {
                    'typescript/consistent-type-imports': 'error',
                    'typescript/no-dynamic-delete': 'off',
                    'typescript/no-non-null-assertion': 'off',
                    'typescript/prefer-for-of': 'off'
                },
                globals: {
                    AsyncDisposableStack: 'readonly',
                    DisposableStack: 'readonly',
                    SuppressedError: 'readonly'
                },
                env: {
                    es2022: true,
                    node: true
                }
            },
            {
                files: ['**/test/**', '**/tests/**', '**/__tests__/**', '**/*.{test,spec}.{js,mjs,cjs,ts,tsx,mts,cts}'],
                rules: {
                    'no-unused-expressions': 'off'
                },
                env: {
                    mocha: true
                }
            },
            {
                files: ['**/package.json', '**/package-lock.json'],
                rules: {},
                jsPlugins: []
            }
        ],
        options: {
            typeAware: true,
            typeCheck: true
        },
        jsPlugins: [
            {
                name: 'vite-plus',
                specifier: 'vite-plus/oxlint-plugin'
            }
        ]
    },
    fmt: {
        tabWidth: 4,
        singleQuote: true,
        printWidth: 120,
        trailingComma: 'none',
        sortPackageJson: false,
        ignorePatterns: ['.claude', '.agents', 'public/ammo']
    },
    // Relative URLs, so the build runs wherever it's served from: a domain root, a subpath such as
    // GitHub Pages or itch.io, or a Snapchat Web Lens
    base: './',
    build: {
        // A PlayCanvas build is 1-2.5 MB minified (300-600 kB gzipped), nearly all of it engine code the
        // first frame needs, so warn only for chunks well past that rather than at Vite's 500 kB default
        chunkSizeWarningLimit: 3000
    },
    plugins: lazyPlugins(() => [
        {
            // Dev only: install the PlayCanvas Inspector before the app starts (press ` to toggle)
            name: 'playcanvas-inspector',
            apply: 'serve',
            config: () => ({ optimizeDeps: { include: ['@playcanvas/inspector'] } }),
            transformIndexHtml: () => [
                {
                    tag: 'script',
                    attrs: { type: 'module', src: '/src/inspector.ts' },
                    injectTo: 'head-prepend'
                }
            ]
        }
    ])
});
