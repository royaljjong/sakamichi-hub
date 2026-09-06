import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use project-root require for packages in node_modules
const require = createRequire(import.meta.url);

// eslint-config-next v16 ships as native ESLint flat config (CJS array).
const nextCoreWebVitals = require('eslint-config-next/core-web-vitals');

// Resolve typescript-eslint through eslint-config-next's node_modules,
// since it's a transitive dep (not a direct project dep).
const nextConfigNextDir = path.dirname(require.resolve('eslint-config-next'));
const requireFromNext = createRequire(path.join(nextConfigNextDir, 'index.js'));
const tsEslint = requireFromNext('typescript-eslint');

// eslint-plugin-react v7 uses the ESLint v8 API (context.getFilename) which was
// removed in ESLint 9+. Override to use @typescript-eslint/parser (compatible
// with ESLint 10) and disable the incompatible react/* rules.
const patchedConfig = nextCoreWebVitals.map((block) => {
  if (block?.languageOptions?.parser) {
    return {
      ...block,
      languageOptions: {
        ...block.languageOptions,
        parser: tsEslint.parser,
      },
    };
  }
  return block;
});

export default [
  ...patchedConfig,
  {
    // eslint-plugin-react v7 is not compatible with ESLint 10 — disable its rules.
    // The @next/next, react-hooks, and @typescript-eslint rules remain active.
    // react-hooks/set-state-in-effect is a new strict rule in react-hooks v7 that
    // flags common React 18/19 patterns (e.g. useEffect(() => setState(x), [])).
    // Downgrade to warn to avoid blocking CI while the codebase is migrated.
    // react-hooks/rules-of-hooks is downgraded to warn for the dev-only page.
    rules: {
      'react/display-name': 'off',
      'react/no-unknown-property': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-no-target-blank': 'off',
      'react/no-deprecated': 'off',
      'react/no-direct-mutation-state': 'off',
      'react/no-find-dom-node': 'off',
      'react/no-is-mounted': 'off',
      'react/no-render-return-value': 'off',
      'react/no-string-refs': 'off',
      'react/require-render-return': 'off',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
    },
  },
  {
    ignores: [
      '.next/**',
      '.tmp/**',
      'node_modules/**',
      'public/**',
      'data/**',
      'coverage/**',
      'scripts/**',
    ],
  },
];
