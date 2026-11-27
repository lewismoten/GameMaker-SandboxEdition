#!/usr/bin/env bash
# Run from web/. A viewer that ignores Escape must never produce a close sample.
set -eu
mkdir -p ../.tmp
fixture=$(mktemp -d "$(pwd)/../.tmp/box-close.XXXXXX")
trap 'rm -rf "$fixture"' EXIT
cat > "$fixture/desk.html" <<'HTML'
<div aria-label="The 1994 desk">
  <button class="shelf-box" aria-label="Virus Blaster box" onclick="document.querySelector('.box-viewer').hidden=false">Open</button>
</div>
<div class="box-viewer" role="dialog" hidden>Virus Blaster</div>
HTML
if npx vite-node scripts/perfBoxClose.ts -- --url "file://$fixture/desk.html?fixture" --runs 1 --hold 0 --throttle 1 --out "$fixture" >"$fixture/log" 2>&1; then
  cat "$fixture/log"
  exit 1
fi
rg -q 'Box viewer still visible after Escape' "$fixture/log" && ! rg -q 'run 1: close INP' "$fixture/log"
