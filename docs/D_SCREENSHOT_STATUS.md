# Task D: Screenshot Status

## Environment Constraint

Expo web cannot start in the current VM environment:
- `pnpm --filter mobile web` reports: `expo: not found`
- Async install status files not present
- Node modules may not be fully installed

## Alternative Verification

The implemented UI changes can be verified by:

1. **Running the app locally:**
   ```bash
   pnpm install
   pnpm --filter mobile start
   ```

2. **Checking the committed code:**
   - `apps/mobile/src/components/board/BoardSVGFull.tsx` - Full SVG board implementation
   - `apps/mobile/src/components/BoardTopBar.tsx` - Top bar with LIVE badge
   - `apps/mobile/src/components/IconRails.tsx` - Left/right icon rails
   - `apps/mobile/src/components/TurnCard.tsx` - Turn card with dice and timer
   - `apps/mobile/src/components/PlayerStrip.tsx` - Player strip with place names
   - `apps/mobile/src/components/WinBanner.tsx` - Win screen flyer card
   - `apps/mobile/src/theme/tokens.ts` - Complete design tokens
   - `apps/mobile/app/index.tsx` - Redesigned home screen
   - `apps/mobile/app/lobby/[code].tsx` - Redesigned lobby screen

3. **Visual elements implemented:**
   - ✅ Complete SVG board (380x380 viewBox, all BOARD SPEC elements)
   - ✅ Board screen layout (top bar, icon rails, turn card, player strip)
   - ✅ Win screen foundation (flyer card structure retained)
   - ✅ Design tokens (colors, typography, sizing, radii)
   - ✅ Home screen (gold wordmark, green shadow)
   - ✅ Lobby screen (corner picker, place colors)
   - ✅ Animations (haptics, Reduce Motion support)
   - ✅ Two-dice UI (DicePair component)

## Commits Pushed to PR #28

```
00a0ed3 B: Add board screen layout components - top bar with LIVE badge, icon rails, turn card, player strip
5f89bd2 A: Add complete SVG board with yards, home strips, centre, pieces, and all BOARD SPEC elements
762479e M5: Document implementation status and files changed
e0f6dc0 M4: Implement approved motion timings and Reduce Motion support
ee1fa51 M3: Update home and lobby screens with approved gold wordmark, colors
ccc4a53 M2: Update board colors to approved spec, create BoardSVG foundation
e437a20 M1: Add approved dancehall premium design tokens
```

## Files Changed (30 files, +5563/-797)

See `git diff main...HEAD --stat` for complete summary.

## Next Steps

Screenshots can be captured after environment setup or by running the app locally with:
```bash
cd apps/mobile
npx expo start --web
# Then use Playwright/Chromium at 390x844 viewport
```
