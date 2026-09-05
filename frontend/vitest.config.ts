import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * Test configuration, kept separate from vite.config.ts on purpose.
 *
 * Merging the two makes TypeScript compare Vite 8's rolldown plugin types against
 * Vitest's rollup ones, which do not match. Two files, two type universes, no conflict.
 * Tailwind is absent here because tests assert on behaviour and markup, never on styles.
 *
 * This file is deliberately outside tsconfig.node.json's include list. The same rolldown
 * and rollup mismatch surfaces when type-checking it, and it is tool configuration rather
 * than shipped code: Vitest reads it directly and the test run is what proves it correct.
 * Revisit once Vitest ships rolldown-compatible plugin types.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom gives component tests a DOM. Node alone cannot render React.
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Only our own tests. Without this, Vitest walks node_modules.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        // Translation bundles are data, not logic.
        'src/locales/**',
      ],
    },
  },
})
