import js from '@eslint/js'
import globals from 'globals'
import importX from 'eslint-plugin-import-x'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      // Type-checked rather than the plain recommended set: the rules that need type
      // information are the ones that catch the mistakes tsc does not, a floating promise
      // above all. Every screen here calls the API, and a promise nobody awaits is a
      // request whose failure disappears.
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'import-x': importX,
    },
    rules: {
      // Console output in a browser app is debugging left behind. Errors belong in the
      // error boundary and in a report to the user, not in a devtools panel nobody has
      // open. warn and error stay allowed for genuine problems.
      'no-console': ['error', { allow: ['warn', 'error'] }],

      // A file this long is a screen doing several jobs. An error now that every file is
      // under it: a warning nobody has to act on is not a limit, it is a note, and the
      // count had been climbing back up between phases while the warning sat there.
      //
      // 325 rather than the 300 originally planned, because that is what the largest
      // remaining file measures and it is one screen's flow: the nutrition page's tabs,
      // draft, save and day's list read the same state, and splitting them would mean two
      // files sharing it. A ceiling nobody can meet gets raised or deleted; this one is a
      // real budget with 25 lines of room, and the next screen to outgrow it fails the
      // build rather than earning another warning.
      'max-lines': ['error', { max: 325, skipBlankLines: true, skipComments: true }],

      // Imports in a fixed order, so a diff shows what changed rather than where the
      // editor decided to put a line.
      'import-x/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      // An import that resolves to nothing is a runtime crash the type checker can miss
      // when the path is dynamic.
      'import-x/no-duplicates': 'error',
    },
  },

  {
    // Browser tests are Playwright, not React. The React rules would flag helper names and
    // find no components to check.
    //
    // The type-aware rules are off here for a different reason: e2e/ is outside the
    // tsconfig that describes the application (it is a separate program with its own
    // config), so the project service has no types for these files and every rule that
    // needs them reports a parsing error rather than a finding.
    files: ['e2e/**/*.ts'],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },

  {
    // Test files assert on behaviour; the strict rules that protect production code get
    // in the way here without catching anything. max-lines in particular: a spec file is
    // long because it covers many cases, which is the point.
    files: ['src/**/*.{test,spec}.{ts,tsx}', 'src/test/**', 'e2e/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      'no-console': 'off',
      'max-lines': 'off',
    },
  },

  {
    // Translation bundles are data, and their length is the content: legal.ts holds the
    // privacy policy and the terms in four languages, and no decomposition makes a legal
    // text shorter. Exempt rather than accommodated, because a ceiling high enough to
    // admit 1400 lines of translations would no longer say anything about a screen.
    files: ['src/locales/**'],
    rules: {
      'max-lines': 'off',
    },
  },

  {
    // Configuration files are not part of the typed program (vitest.config.ts is
    // deliberately outside tsconfig, see the comment in it), so the type-aware rules have
    // no type information to work from here.
    files: ['*.config.{ts,js}', 'eslint.config.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
])
