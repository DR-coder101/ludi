# Cursor Agent Skills

This repository includes verified agent skills in `.cursor/skills/` to guide Cursor cloud agents working on Ludi.

## Vendored Skills

### Expo Skills (MIT)
- **expo-animation** — Official Expo guidance for Reanimated + Gesture Handler + expo-haptics (piece motion, dice, press feedback)
- **expo-native-ui** — Official Expo native UI and styling patterns for mobile screens
- **expo-design-system** — Design tokens must be used, not merely defined (addresses theme-constants-never-rendered)
- **expo-router** — Navigation patterns for Ludi's pass-and-play, online, and video flows

### Vercel React Native Skills (MIT)
- **vercel-react-native-skills** — Structured RN/Expo rules for Reanimated, lists, monorepo native dependencies

### Software Mansion React Native Best Practices (MIT)
- **software-mansion-react-native-best-practices** — Vendor of Reanimated, Gesture Handler, and react-native-svg (core of Ludi board rendering and motion)

### Frontend Design (Apache-2.0)
- **frontend-design** — Distinctive visual design and anti-generic-AI aesthetics for Jamaican green/gold/black board UI

## Ludi-Specific Skill

- **ludi-board-ui** — Ludi board and UI work rules: enforces GAME_RULES.md as source of truth, forbids packages/rules changes for UI work, requires theme constants to be rendered, and requires screenshot/render proof with on-screen coordinates

## Standing Ludi rules

Follow these without being asked. `docs/GAME_RULES.md` is the rules-engine source of truth. If that file or `packages/rules` disagrees with a standing rule, do not change product code. Report the mismatch.

1. The board has a 68-cell track and 7 home cells per colour.
2. Montego Bay is gold, top-left. Ocho Rios is green, top-right. Negril is black, bottom-left. Kingston is red, bottom-right.
3. Safe cells are the start cells only.
4. A 2-player game uses the full 4-yard board.
5. Do not change UI without an approved mockup. The mockup source of truth is outside this repo in Dean's extracted UI set. Ask for the approved mockup. Do not invent one.
6. House rule `blockadeCanMoveTogether` is always false. Do not expose it as a toggle.
7. Play uses two dice. Any single die showing 6 brings one piece out of the yard. A 6-6 throw brings out two. Dean, 2026-10-05. See `docs/GAME_RULES.md` §3.

## Rule enforcement

| Standing rule | What enforces it |
| --- | --- |
| 1. Track and home cells | This list. Engine constants `TRACK_SIZE` and `HOME_COLUMN_LENGTH`. `docs/GAME_RULES.md` §1. |
| 2. Town seats | This list. `docs/GAME_RULES.md` §1. `apps/mobile/src/components/board/boardLayout.ts`. |
| 3. Safe cells | This list. Engine `SAFE_CELLS`. `docs/GAME_RULES.md` §7. |
| 4. 2-player full board | This list. `BoardArt` draws all four yards. |
| 5. Approved mockup | This list only. Ask Dean. Do not invent a mockup. |
| 6. `blockadeCanMoveTogether` | This list. Lobby `HouseRulesPicker` omits the toggle. |
| 7. Two dice and coming out | This list. `docs/GAME_RULES.md` §3. Engine `legalMoves` spends a 6 to leave the yard. |

## Pstack Agent Workflow Pack (MIT)

- **poteto-mode** — For non-trivial work, use poteto-mode workflow (loads the full pstack philosophy)
- **unslop** — Run unslop on all prose and code before finishing any task
- **Proof required** — Prove work with real command output (typecheck, tests, lint). Never present screenshots or results you did not actually produce
- **Game rules** — `docs/GAME_RULES.md` remains the authoritative source of truth for Ludi game rules

The pstack pack (by Lauren Tan, v0.15.13) provides 51 skills covering principles, verification patterns, and agent workflows. See `.cursor/skills/PSTACK.md` for details.

## Important: Expo SDK Version

**Ludi is on Expo SDK 52.** Some vendored Expo skills may reference newer SDK APIs (SDK 56+), such as:
- `@expo/ui` components
- `Color` from expo-router
- `expo-audio` (which replaces `expo-av` in later SDKs)

**When working on this codebase, prefer patterns compatible with Expo SDK 52 and the existing dependencies:**
- Use `expo-av` (not `expo-audio`)
- Use `react-native-svg` for board rendering
- Follow SDK 52 patterns from official Expo documentation when vendor skills reference newer APIs
