#!/bin/bash
# Usage: scripts/stills.sh <comp> <frames...>  → out/stills/<comp>-<frame>.png
B=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
comp=$1; shift
mkdir -p out/stills
for fr in "$@"; do
  npx remotion still "$comp" "out/stills/$comp-$fr.png" --frame=$fr --browser-executable=$B --log=error 2>&1 | grep -v "^\s*at " | tail -3
done
