#!/bin/bash
# Leak sweep over tracked files, recent commit messages and (optionally) a production build.
# Looks for: secret games' ids and titles outside their own folders, 1990s buyers' names ("Dowden"),
# local paths (/Users/lewismoten), .for-lewis, and token/key shapes. Secret names are never printed:
# only counts and file paths (a path that holds a name is shown as <secret>).
# Usage: npm run check:leaks -- [dist-folder] [since-rev]   (default: no build, last 300 commits)
# downloads.html lists the secret games on purpose (Lewis's choice) and is skipped in the build.
# Exits 1 if a build holds any hit. Hits in tracked files are for a person to judge (code, tests
# and docs may name a secret game; players must not see it).
cd "$(git rev-parse --show-toplevel)" || exit 2
dist=${1:-}
since=${2:-HEAD~300}
ids=()
words=()
for f in $(grep -l '"secret": *true' games/*/about.json); do
  d=$(basename "$(dirname "$f")")
  ids+=("$d")
  t=$(node -e 'const a=require("./'"$f"'");console.log(a.title||a.name||"")')
  [ -n "$t" ] && words+=("$t")
done
pat=$(printf '%s\n' "${ids[@]}" "${words[@]}" | paste -sd'|' -)
mask() { sed -E "s#($pat)#<secret>#Ig"; }
excl=()
for i in "${ids[@]}"; do excl+=(":(exclude)games/$i"); done
tmp=$(mktemp)
bad=0

echo "== secret ids/titles in tracked files outside their own folders"
git grep -ilE "\b($pat)\b" -- . "${excl[@]}" ':(exclude)cd' ':(exclude)code' ':(exclude)package-lock.json' >"$tmp"
mask <"$tmp" | head -20
echo "   $(wc -l <"$tmp" | tr -d ' ') file(s)"

echo "== secret ids/titles in commit messages since $since (history may name them)"
git log "$since"..HEAD --format=%B | grep -icE "\b($pat)\b"

echo "== other patterns in tracked files (not cd/, code/, tests, AGENTS.md, CLAUDE.md)"
for p in 'Dowden' '/Users/lewismoten' '\.for-lewis' 'sk-[A-Za-z0-9]{20,}' 'ghp_[A-Za-z0-9]{20,}' 'AKIA[0-9A-Z]{16}' 'BEGIN (RSA |EC )?PRIVATE KEY'; do
  git grep -lIE "$p" -- . ':(exclude)cd' ':(exclude)code' ':(exclude)package-lock.json' ':(exclude)*.test.ts' ':(exclude)AGENTS.md' ':(exclude)CLAUDE.md' ':(exclude).gitignore' ':(exclude).prettierignore' >"$tmp"
  echo "-- $p: $(wc -l <"$tmp" | tr -d ' ') file(s)"
  head -6 "$tmp" | mask | sed 's/^/     /'
done

if [ -n "$dist" ] && [ -d "$dist" ]; then
  echo "== build in $dist (skipped: downloads.html, games/extra-N.json and videos/walk-HASH.json, which are loaded only once a secret game is listed, and the secret games' own folders)"
  # assets/bonus-*.js is the egg system's own code (src/eggs/bonus.ts): it names the secret games' ids by design, is on no page and loads only once an egg is found
  skip=(--exclude=downloads.html --exclude='extra-*.json' --exclude='walk-*.json' --exclude='bonus-*.js')
  for i in "${ids[@]}"; do skip+=("--exclude-dir=$i"); done
  for p in "$pat" '/Users/lewismoten' '\.for-lewis' 'Dowden' 'sk-[A-Za-z0-9]{20,}' 'ghp_[A-Za-z0-9]{20,}'; do
    grep -rIlE "${skip[@]}" "$p" "$dist" >"$tmp" 2>/dev/null
    c=$(wc -l <"$tmp" | tr -d ' ')
    echo "-- $(echo "$p" | mask | cut -c1-30): $c file(s)"
    head -6 "$tmp" | mask | sed 's/^/     /'
    [ "$c" -gt 0 ] && bad=1
  done
fi
rm -f "$tmp"
exit $bad
