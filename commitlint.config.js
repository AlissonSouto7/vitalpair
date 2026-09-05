/**
 * Conventional Commits, enforced at commit time so a bad message is caught before it
 * reaches history, where fixing it means a rebase.
 *
 * The scope list is the feature packages plus the cross-cutting areas. It is a warning,
 * not an error: an unlisted scope is usually a new feature, and blocking that would be
 * annoying without being useful.
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      1,
      'always',
      [
        'activity', 'ai', 'auth', 'dashboard', 'feed', 'gamification', 'mealvision',
        'mission', 'notification', 'nutrition', 'pair', 'progress', 'season', 'tdee',
        'user', 'shared',
        'frontend', 'infra', 'ci', 'docs', 'deps', 'repo', 'security',
      ],
    ],
    // Long explanations belong in the body. The subject stays scannable in a log.
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [0],
  },
}
