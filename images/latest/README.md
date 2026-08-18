# App screenshots

Screenshots shown on the homepage, inside the CSS-drawn iPhone 17 Pro Max frame
(`.ios-device` in `css/main.css`). Nothing here has a phone frame, shadow or
rounded corners baked in — the page draws all of that.

## Adding a screenshot

1. **Take it on an iPhone 17 Pro Max** (device or simulator). It must be
   **1320 x 2868 px**. Other sizes are cropped rather than stretched, so an
   off-size shot loses content from the bottom.
2. **Drop it in the matching group folder** below. Name it after the screen it
   shows, lowercase, hyphens instead of spaces — `surah-list.png`, not
   `Simulator Screenshot ....png`. Spaces become `%20` in URLs.
3. **Run the converter** from the repo root:

   ```
   ./tools/optimize-screenshots.sh
   ```

   This writes a `.webp` next to each `.png` (roughly 70% smaller). Files
   already converted are skipped unless the `.png` is newer.
4. **Reference it in `index.html`** — add one line to the relevant
   `data-screenshots` list, in the form `group/file.webp|Caption for screen readers`.
   One entry per line; captions may contain commas.

## Groups

| Folder           | Used by                                    |
|------------------|--------------------------------------------|
| `home/`          | Header banner                              |
| `quran/`         | Feature showcase — Quran tab               |
| `hadith/`        | Feature showcase — Hadith tab              |
| `prayer-times/`  | Feature showcase — Prayer Times tab        |
| `supplications/` | Feature showcase — Supplications tab       |
| `books/`         | Feature showcase — Books tab               |

A group with one screenshot renders as a static image with no dots. A group with
none is skipped entirely — its tab never appears — so an empty folder costs nothing.

Not every file in a folder is shown: the page only loads what `data-screenshots`
lists. Unlisted files stay as a reserve you can swap in by editing that list.

The `.png` originals are kept as the source of truth; the page only ever loads
the `.webp` files.
