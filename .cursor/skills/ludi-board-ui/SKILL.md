---
name: ludi-board-ui
description: >-
  Ludi (Jamaican Ludi board game) board and UI work. Use for any change to the
  plywood board rendering, theme colors, piece/dice visuals, boardLayout
  geometry, or mobile UI that touches the board. Enforces GAME_RULES.md as
  source of truth, forbids packages/rules changes for UI work, requires theme
  constants to be rendered, and requires screenshot/render proof with on-screen
  coordinates.
license: MIT
---

# Ludi Board UI Skill

This skill governs all work on the Ludi board rendering, visuals, and mobile UI that interacts with the board.

## Source of Truth

**`docs/GAME_RULES.md`** is the authoritative source for game rules and geometry semantics. Also consult:
- `docs/ARCHITECTURE.md` for system architecture
- `docs/PROMPT_PACK.md` for development context
- `docs/QA_RUNBOOK.md` for quality assurance procedures

## Engine Freeze for UI Work

**NEVER modify `packages/rules` for UI or board visual work.** The UI layer consumes engine state; it does not redefine game rules. All rule logic stays in the engine. UI work only changes how the board and pieces are rendered.

## Board Geometry

Board geometry comes from `apps/mobile/src/components/board/boardLayout.ts` coordinate lookup.

**Board specifications:**
- 19×19 plywood board grid
- 8×8 yards
- 3×8 arms
- 3×3 centre
- 52 track positions + 6 home positions
- Engine colour order: Red=0, Green=13, Yellow=26, Blue=39

**Do not invent alternate track indices.** Use the existing geometry from `boardLayout.ts`.

## Theme Constants Must Render

Any theme constant added (colors, shadows, materials) **MUST be referenced by a rendered component.** Defining unused theme tokens is a failure.

Prefer extending existing theme modules and wiring them into:
- The SVG board rendering
- Mobile screens and components

## Verification Gate (Required for Every Board/UI PR)

Before considering any board or UI work complete, you must provide:

1. **Before/after screenshot OR other render proof:**
   - Device/simulator screenshot
   - SVG export
   - Storybook-style snapshot

2. **List changed on-screen coordinates:**
   - Board cells affected (indices)
   - Yard / arm / centre / home indices
   - Pixel or layout coordinates affected

3. **Call out if not visible on device:**
   - If a change was not visible on device, explain why

## Stack Notes

- **Board rendering:** `react-native-svg`
- **Motion/animation:** `react-native-reanimated`
- **Feedback:** `expo-haptics` / `expo-av`

Prefer these existing dependencies over introducing Skia or other rendering libraries unless explicitly requested.

## Cross-Skills Integration

When working on board UI tasks, load related skills for deeper guidance:

- **For motion/animation:** Load `expo-animation` and Software Mansion's `animations` / `gestures` references
- **For design tokens:** Load `expo-design-system`
- **For SVG work:** Load Software Mansion's `svg` references
- **For distinctive visuals:** Load `frontend-design`

Always apply this skill's verification gate on top of any cross-skill guidance.

## Summary Checklist

Before completing any board/UI task:

- [ ] Engine (`packages/rules`) was not modified for UI work
- [ ] Geometry comes from `boardLayout.ts`
- [ ] New theme constants are actually rendered
- [ ] Screenshot/render proof provided
- [ ] On-screen coordinates documented
- [ ] Stack notes followed (svg, reanimated, haptics/av)
