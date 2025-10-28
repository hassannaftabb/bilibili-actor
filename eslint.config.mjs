import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslint from 'typescript-eslint';
import apifyConfig from '@apify/eslint-config';

const compat = new FlatCompat({
    baseDirectory: import.meta.dirname,
    recommendedConfig: js.configs.recommended,
});

export default [
    ...compat.extends('@apify/eslint-config'),
    ...typescriptEslint.configs.recommended,
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: typescriptEslint.parser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
        },
    },
    {
        ignores: ['dist/**', 'node_modules/**'],
    },
];
