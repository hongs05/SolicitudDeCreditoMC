import boundaries from 'eslint-plugin-boundaries';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**', 'apps/web/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['packages/domain/src/**/*.ts', 'apps/api/src/**/*.ts'],
    ignores: ['**/*.spec.ts', '**/testing/**'],
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['packages/domain/tsconfig.json', 'apps/api/tsconfig.json'],
        },
      },
      'boundaries/include': ['packages/domain/src/**/*', 'apps/api/src/**/*'],
      'boundaries/elements': [
        { type: 'dominio-compartido', pattern: 'packages/domain/src/**/*', mode: 'full' },
        { type: 'api-domain', pattern: 'apps/api/src/*/domain/**/*', mode: 'full' },
        { type: 'api-application', pattern: 'apps/api/src/*/application/**/*', mode: 'full' },
        { type: 'api-infrastructure', pattern: 'apps/api/src/*/infrastructure/**/*', mode: 'full' },
      ],
    },
    rules: {
      'boundaries/element-types': ['error', {
        default: 'allow',
        rules: [
          { from: 'dominio-compartido', disallow: ['api-domain', 'api-application', 'api-infrastructure'] },
          { from: 'api-domain', disallow: ['api-application', 'api-infrastructure'] },
          { from: 'api-application', disallow: ['api-infrastructure'] },
        ],
      }],
      'boundaries/external': ['error', {
        default: 'allow',
        rules: [
          { from: ['dominio-compartido', 'api-domain', 'api-application'], disallow: ['**'] },
        ],
      }],
    },
  },
);
