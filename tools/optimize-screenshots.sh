#!/usr/bin/env bash
#
# Convert app screenshots in images/latest/ from PNG to WebP.
#
# Usage:   ./tools/optimize-screenshots.sh
#
# Drop plain 1320x2868 iPhone 17 Pro Max screenshots (no frame, no shadow)
# into the matching group folder under images/latest/ (quran/, hadith/,
# prayer-times/, supplications/, books/, home/), run this, then reference
# the .webp path in the data-screenshots list in index.html.
#
# Subdirectories are scanned recursively.
#
# Existing .webp files are only rebuilt when the .png is newer, so re-running
# is cheap. Requires cwebp:  brew install webp
#
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/images/latest"
QUALITY=82

command -v cwebp >/dev/null || { echo "cwebp not found. Install it with: brew install webp" >&2; exit 1; }
[ -d "$DIR" ] || { echo "No such directory: $DIR" >&2; exit 1; }

# find, not a glob: macOS ships bash 3.2, which has no globstar for **
png_total=0
webp_total=0
converted=0

while IFS= read -r png; do
    webp="${png%.png}.webp"
    name="${png#$DIR/}"

    if [ -f "$webp" ] && [ "$webp" -nt "$png" ]; then
        echo "  skip    $name (up to date)"
    else
        cwebp -quiet -q "$QUALITY" "$png" -o "$webp"
        converted=$((converted + 1))
        po=$(wc -c < "$png"); wo=$(wc -c < "$webp")
        printf "  convert %-34s %5s KB -> %4s KB\n" "$name" "$((po/1024))" "$((wo/1024))"
    fi

    png_total=$((png_total + $(wc -c < "$png")))
    webp_total=$((webp_total + $(wc -c < "$webp")))
done < <(find "$DIR" -type f -name '*.png' | sort)

if [ "$png_total" -eq 0 ]; then
    echo "No .png files found in $DIR"
    exit 0
fi

echo
echo "Converted $converted file(s)."
printf "Total: %s KB PNG -> %s KB WebP (%s%% smaller)\n" \
    "$((png_total/1024))" "$((webp_total/1024))" \
    "$(( 100 - (webp_total * 100 / png_total) ))"
