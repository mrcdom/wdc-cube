import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
    {
        ignores: ['**/node_modules/**', '**/lib/**', '**/dist/**', '**/build/**', '**/coverage/**']
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
            // Fixo em vez de 'detect': o react nao e dependencia da raiz do
            // workspace, entao a deteccao falha e o plugin avisa a cada execucao.
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
    prettier
)
