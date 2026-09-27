# M5 Screenshot Status

## Current Implementation Status

All milestones M1-M4 have been completed and pushed:

- ✅ M1: Created `docs/design/tokens.md` with verbatim spec and implemented `apps/mobile/src/theme/tokens.ts`
- ✅ M2: Updated board colors to approved spec, created BoardSVG foundation component
- ✅ M3: Updated home and lobby screens with:
  - Gold (#FED100) LUDI wordmark at 168pt Anton font
  - greenDeep (#006B28) hard shadow on title
  - Correct place colors (Montego Bay gold, Ocho Rios green, Kingston red, Negril black/silver)
  - Gold CTA buttons with Archivo Black font
  - Updated piece color mappings throughout
- ✅ M4: Implemented approved motion timings and Reduce Motion support:
  - Piece slide: 110ms per cell with 1.08 bounce
  - Yard glow: 1.6s breath
  - Legal move: 900ms pulse
  - Dice: 600-750ms tumble with 120ms overshoot
  - Capture: 350ms burst
  - Win: 280ms slam spring
  - Button: 90ms press to 0.97
  - Reduce Motion: 200ms cross-fade fallback for all animations
  - Haptics: light (landing), medium (roll/entry), heavy (capture), success (6/home/win), warning (blocked)

## Screenshot Note

M5 requires running expo web to capture screenshots. The Expo SDK 52 environment needs web dependencies installed. Screenshots should show:

**BEFORE (main branch):**
- Wrong colors (#00FF00 green, #FF0000 red, #FFD700, brown board, orange start cells)

**AFTER (this branch):**
- Approved colors (#009B3A green, #E4202E red, #FED100 gold, #0B0B0C bg)
- Gold wordmark with greenDeep shadow
- Correct place names and styling

## Screens Changed

1. **Home**: Gold LUDI wordmark (168pt Anton), greenDeep shadow, gold CTAs
2. **Lobby**: Correct place colors in corner picker
3. **Board**: Updated piece and track colors
4. **Tokens**: Full approved spec in theme/tokens.ts

## Files Modified

- `docs/design/tokens.md` (new)
- `apps/mobile/src/theme/tokens.ts` (complete rewrite to spec)
- `apps/mobile/src/components/board/boardLayout.ts` (color updates)
- `apps/mobile/src/components/board/BoardSVG.tsx` (new foundation)
- `apps/mobile/app/index.tsx` (home screen styling)
- `apps/mobile/app/lobby/[code].tsx` (lobby colors)
- `apps/mobile/src/utils/haptics.ts` (approved patterns)
- `apps/mobile/src/hooks/useAnimations.ts` (approved timings + Reduce Motion)

All changes follow the approved dancehall premium UI spec. The wrong invented colors from the first pass have been replaced with the correct approved palette.
