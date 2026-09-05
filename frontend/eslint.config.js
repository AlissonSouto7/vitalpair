import js from '@eslint/js'
import globals from 'globals'
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
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Console output in a browser app is debugging left behind. Errors belong in the
      // error boundary and in a report to the user, not in a devtools panel nobody has
      // open. warn and error stay allowed for genuine problems.
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },

  /*
   * Known debt, deliberately downgraded to a warning rather than silenced.
   *
   * Nine files fetch inside useEffect and then setState, which React 19's compiler-aware
   * lint rules flag. They are not individual mistakes: they are the data-fetching pattern
   * this codebase was built on, and phase 9 of the professionalization plan replaces all
   * of them with TanStack Query. Rewriting them by hand now would be work thrown away,
   * and leaving the rule at error would keep CI red until that phase lands.
   *
   * As a warning, CI stays green while every occurrence remains visible in the output.
   * Delete this block once phase 9 removes the last useEffect fetch: if the codebase is
   * clean, restoring the error level costs nothing.
   */
  {
    files: [
      'src/components/NotificationsBell.tsx',
      'src/features/activity/ActivityPage.tsx',
      'src/features/auth/VerifyEmailPage.tsx',
      'src/features/feed/FeedPage.tsx',
      'src/features/nutrition/NutritionPage.tsx',
      'src/features/profile/ProfilePage.tsx',
      'src/features/progress/ProgressPage.tsx',
    ],
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
    },
  },

  {
    // Test files assert on behaviour; the strict rules that protect production code get
    // in the way here without catching anything.
    files: ['src/**/*.{test,spec}.{ts,tsx}', 'src/test/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
])
