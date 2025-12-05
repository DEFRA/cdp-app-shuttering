import neostandard from 'neostandard'
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

export default [
  ...neostandard({
    env: ['node'],
    ignores: [
      ...neostandard.resolveIgnoresFromGitignore(),
      ...['.idea', '.cache', 'node_modules', '.dist', 'raw-assets']
    ],
    noJsx: true,
    noStyle: true
  }),
  prettierConfig, // Disable rules that conflict with prettier
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    plugins: {
      prettier: prettierPlugin
    },
    rules: {
      'prettier/prettier': 'error',
      'no-console': 'error'
    }
  }
]
