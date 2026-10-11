# Ludi Live: Wonder overlay design export

Read-only export of Dean's Wonder file **"Ludi Live - TikTok Overlay"**
(https://app.wonder.so/dean/files/01a1280f-1b74-77f2-96d4-e2a6357d0791, page "Page 1", branch main),
taken on 2026-10-11. Nothing in Wonder was edited. Cloud agents cannot reach Wonder, so this folder is the source of truth for building the overlay. Match it exactly.

## Canvas
- Every artboard is **1080 x 1920 px** (9:16 portrait, TikTok LIVE / OBS browser source).
- Content column: 880 px wide, centred, with 100 px side padding.
- **TikTok safe zone: x 100-980, y 40-1380** on 1080x1920. All interactive or critical UI must sit inside it. This comes from one screenshot, so confirm it on the real test stream.

## Approved copy change
- The Waiting Screen badge (`are.now`, "Winner Stays Text") reads **WINNER STAYS** in the design. It **must read `WINNER CAN STAY`** in the build. Dean approved this wording change.
- The Winner Screen already says "WINNER CAN STAY". The v4 game board badge (`fit.els` / `way` equivalent) also says "WINNER STAYS"; the brief only names the Waiting badge, so ask before changing that one too, or keep the wording consistent if Dean confirms.

## Artboards

| Folder | Wonder artboard | id | Size | Status |
|---|---|---|---|---|
| intro-screen/ | Ludi Live TikTok Overlay - Intro Screen | ape | 1080x1920 | Build (approved set) |
| waiting-screen/ | Ludi Live TikTok Overlay - Waiting Screen | are | 1080x1920 | Build (badge -> WINNER CAN STAY) |
| v4-app-board/ | Ludi Live TikTok Overlay v4 - App Board | fit | 1080x1920 | Build: game screen, Kingston (red) turn + turn card |
| v4-app-board-green/ | Ludi Live TikTok Overlay v4 - App Board Green | way | 1080x1920 | Build: same screen, Ocho Rios (green) turn, shows how the turn colour swaps |
| winner-screen/ | Ludi Live TikTok Overlay - Winner Screen | auk | 1080x1920 | Build |
| v3-no-card/ | Ludi Live TikTok Overlay v3 | you | 1080x1920 | Reference only (older cream board, no turn card) |
| v3-turn-card/ | Ludi Live TikTok Overlay v3 - Turn Card | sin | 1080x1920 | Reference only |
| v3-turn-card-green/ | Ludi Live TikTok Overlay v3 - Turn Card Green | ako | 1080x1920 | Reference only |
| v2-overlay/ | Ludi Live TikTok Overlay v2 | mot | 1080x1920 | Reference only (superseded) |
| v1-overlay/ | Ludi Live TikTok Overlay | era | 1080x1920 | Reference only (superseded) |

**No "v4 (no card)" artboard exists in the file.** The only board without the turn card is the older v3 (`v3-no-card/`). For the v4 game screen without the turn card, use `v4-app-board/` and leave out the "Turn Announcement Card" overlay. The board underneath is a single raster image, so nothing else changes.

## Per-artboard files
- `screenshot.png`: 1080x1920 render of `code.jsx` (Chrome, DPR 1, Tailwind v4, Baloo 2 from Google Fonts), checked by eye against Wonder's own capture.
- `wonder-screenshot.png`: Wonder's native `take_screenshot` (mode full). It is only 461x819 (Intro, Waiting) or 576x1024 (others) because that is the largest size Wonder returns. If the two screenshots ever differ, Wonder's capture is the source of truth.
- `context.md`: fonts (family, weight, size), colours, every text string verbatim, and a per-element list of position and size in artboard px with background, border, radius, shadow, filter and transform.
- `elements.json`: the raw `get_element_tree` output (depth 50), plus the same tree parsed into nested JSON with a rendered `box` (x, y, w, h) per node.
- `code.jsx`: the `get_element_code` output, unmodified (React + Tailwind JSX, inline `style` only for background-image URLs).
- `assets/`: background photo(s) and board image(s) used by the artboard, downloaded from cdn.wonder.so. `assets/icons/`: every inline SVG pulled from the code into standalone .svg files.

## Shared assets (`shared-assets/`)
- `6ce5af0a...jpg` (1080x1920): **"Backdrop Photo - Dean Beach Sunset"**, the background for Intro, Waiting, v4 and Winner. The layer is labelled "Swap For Jamaica Photo", so make it replaceable.
- `5b63a90b...png` (1680x1680): v4 board, **Kingston active** (red glow), shown at 840x840.
- `b01e4982...png` (1680x1680): v4 board, **Ocho Rios active** (green glow), shown at 840x840.
- `7d38415f...jpg` (1400x2489): green-leaf background used by v1-v3 only.

Important: in v4 the board, including the four town yards (MONTEGO BAY, OCHO RIOS, NEGRIL, KINGSTON), the track, the home columns and the pieces, is **one flat raster image per active town**. Only the Kingston-active and Ocho Rios-active versions exist. A live game needs the board drawn in code (pieces move), so rebuild it as vector/DOM to match these images pixel for pixel, with a version for each of the four active towns (Montego Bay gold and Negril black glow aren't in the file, so extrapolate from the red and green ones).

## Fonts
- **Baloo 2** (Google Fonts, https://fonts.google.com/specimen/Baloo+2) is the only face used in every artboard. Stack: `'Baloo 2', Fredoka, Inter, sans-serif`. Weights used in the code are 900 (`font-black`, most text), 700 and 600. Baloo 2 only goes up to 800 on Google Fonts, so 900 renders as 800, which is also what Wonder shows. Load `Baloo+2:wght@400..800`.
- Fredoka and Inter (both Google Fonts) are fallbacks only and aren't visible in the designs.
- One tiny separator "·" on the Waiting Screen has no font set and falls back to the system sans.
- No custom or self-hosted fonts.

## Design tokens and icons
`tokens.json`: Wonder returned **no design tokens and no icon library** (both empty). Every value is a hard-coded hex. `tokens.json` therefore lists the literal palette the approved artboards use (Jamaica gold `#fed100`, green `#009b3a`, ink `#111111`, cream `#f3e7c9`, Kingston red `#e4202e` / `#ff3340`, Ocho Rios green `#19c45a`, Montego Bay gold `#fed100`, Negril silver `#d9dce1` on black, and so on). Those are derived from the code, not Wonder tokens. Icons are inline SVGs (Font Awesome / Feather style paths), exported per artboard to `assets/icons/`.

## Tailwind quirks in code.jsx
- `tracking-N` = letter-spacing N x 4 px (`tracking-1.5` = 6 px). This isn't standard Tailwind.
- `drop-shadow-[rgb(17,_17,_17)_0px_8px_0px]` = hard offset shadow with no blur (`filter: drop-shadow(...)`). Tailwind v4 didn't apply these arbitrary values, so the render patched them.
- Hard "sticker" shadows are `shadow-[0px_6px_0px_...]`, and glows are `shadow-[0px_0px_36px_rgba(...)]`.

## Product rules to keep (from the brief)
Reuse `packages/rules` unchanged. Town colours: Kingston red, Ocho Rios green, Montego Bay gold, Negril black. Gifts are cosmetic only. Dean approves any UI deviation from these designs.
