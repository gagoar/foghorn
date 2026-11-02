#!/usr/bin/env bash
# Render the social image the social image from docs/assets/og.html with headless Chrome. Needs Chrome or Chromium.
# Run it after a change to og.html or icon.svg, and commit the image it writes.
# It writes one image into docs/assets and nothing else.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
chrome="${CHROME:-}"
for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" google-chrome chromium chromium-browser; do
  [ -n "$chrome" ] && break
  if [ -x "$c" ] || command -v "$c" >/dev/null 2>&1; then chrome="$c"; fi
done
[ -n "$chrome" ] || { echo "render-assets: set CHROME to a Chrome or Chromium binary" >&2; exit 1; }
name="og"
ext="png"
out="$here/docs/assets/$name.$ext"
"$chrome" --headless --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,630 \
  --screenshot="$out" "file://$here/docs/assets/og.html" >/dev/null 2>&1
echo "wrote ${out#"$here"/}"
