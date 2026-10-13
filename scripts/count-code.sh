#!/usr/bin/env bash
# Counts the code, so a document never has to claim a number from memory.
#
#   scripts/count-code.sh            the numbers, one per line
#   scripts/count-code.sh --sentence the sentence docs/ARCHITECTURE.md carries
#
# Why this exists: ARCHITECTURE.md opened with "Measured on 2026-09-12: 495 backend
# classes, 16,647 lines of Java, 28 migrations, 23 mapped tables, 189 frontend modules".
# A month later every one of those five numbers was wrong, by as much as 70 modules, and
# the sentence still said "measured". A count written by hand is a claim that decays
# silently, which is worse than no count: a reader has no way to tell a measured number
# from a remembered one.
#
# Counted from the working tree, not from git, so it reflects what is actually there.
set -euo pipefail

cd "$(dirname "$0")/.."

backend_classes=$(find src/main/java -name '*.java' | wc -l)
java_lines=$(find src/main/java -name '*.java' -exec cat {} + | wc -l)
migrations=$(find src/main/resources/db/migration -name '*.sql' | wc -l)
# A mapped table is a JPA entity. Flyway may have created more (join tables, views), so
# this is "tables the code maps", which is what the sentence says.
#
# find | xargs rather than `grep --include`: that flag is GNU, and BusyBox grep, which is
# what an Alpine container has, rejects it outright. Measured in bash:4.3 (Alpine):
# "grep: unrecognized option: include=*.java".
mapped_tables=$(find src/main/java -name '*.java' -exec grep -l '@Entity' {} + | wc -l)
frontend_modules=$(find frontend/src \( -name '*.ts' -o -name '*.tsx' \) | wc -l)
feature_packages=$(find src/main/java/com/aps/vitalpair -mindepth 1 -maxdepth 1 -type d | wc -l)

# A thousands separator, without assuming a locale is installed: 20219 -> 20,219.
group() { echo "$1" | sed -E ':a;s/([0-9])([0-9]{3})($|,)/\1,\2\3/;ta'; }

if [ "${1:-}" = "--sentence" ]; then
  printf 'Measured on %s: %s backend classes across %s feature packages, %s\n' \
    "$(date +%Y-%m-%d)" "${backend_classes}" "${feature_packages}" "$(group "${java_lines}")"
  printf 'lines of Java, %s migrations, %s mapped tables, %s frontend modules.\n' \
    "${migrations}" "${mapped_tables}" "${frontend_modules}"
else
  printf 'backend classes   %s\n' "${backend_classes}"
  printf 'lines of Java     %s\n' "$(group "${java_lines}")"
  printf 'migrations        %s\n' "${migrations}"
  printf 'mapped tables     %s\n' "${mapped_tables}"
  printf 'frontend modules  %s\n' "${frontend_modules}"
  printf 'feature packages  %s\n' "${feature_packages}"
fi
