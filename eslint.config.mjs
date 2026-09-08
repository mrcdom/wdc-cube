import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
    {
        ignores: [
            '**/node_modules/**',
            '**/lib/**',
            '**/dist/**',
            '**/build/**',
            '**/coverage/**',
            // Angular's dev-server cache
            '**/.angular/**',
            // Scratch space: notes, downloads and temporary scripts, never source
            '.claude/**'
        ]
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            globals: { ...globals.browser, ...globals.node },
            parserOptions: {
                ecmaFeatures: { jsx: true }
            }
        },
        settings: {
            // Pinned rather than 'detect': react is not a dependency of the
            // workspace root, so detection fails and the plugin warns on every run.
            react: { version: '19.1' }
        },
        plugins: { react },
        rules: {
            ...react.configs.flat.recommended.rules,
            'react/prop-types': 'off',
            'react/react-in-jsx-scope': 'off',
            'no-unused-vars': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            'semi-style': 'error',
            semi: ['error', 'never'],
            'jsx-quotes': ['error', 'prefer-double']
        }
    },
    {
        // SolidJS compiles JSX to DOM rather than to React elements, so its
        // attributes are the DOM's: `class`, not `className`. The React plugin
        // reads the same syntax and reaches the opposite conclusion, and there
        // is no React in these packages for it to be right about.
        files: ['libs/cube-solid/**/*.{ts,tsx}', 'apps/cube-tutorial/renderer-solid/**/*.{ts,tsx}'],
        rules: {
            'react/no-unknown-property': 'off'
        }
    },
    prettier
)
