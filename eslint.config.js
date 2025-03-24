import globals from 'globals'
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'

export default tseslint.config([
  { files: ['src/**/*.{js,mjs,cjs,ts}'] },
  { ignores: ['dist', 'src/_x/**/*', 'src/plugins/history/*'] },
  { languageOptions: { globals: globals.browser } },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  stylistic.configs.recommended,
  stylistic.configs.customize({
    braceStyle: '1tbs',
  }),
  {
    rules: {
      'no-control-regex': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
])
