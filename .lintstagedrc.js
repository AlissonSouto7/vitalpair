/**
 * Formatters run against the staged files only.
 *
 * The Maven wrapper goes through `sh -c` because lint-staged spawns commands without a
 * shell, and on Windows that means `./mvnw` (a shell script) is handed to cmd.exe, which
 * cannot run it: "'mvnw' is not recognized". Husky's own hook runs under sh, so sh is
 * always present. `mvnw.cmd` would fix Windows and break everywhere else.
 */
export default {
  'frontend/**/*.{ts,tsx}': [
    'prettier --write',
    'npm --prefix frontend exec -- eslint --fix --no-warn-ignored',
  ],
  'src/**/*.java': ["sh -c './mvnw -q spotless:apply'"],
  '*.{md,yml,yaml,json}': ['prettier --write'],
}
