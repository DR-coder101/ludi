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

## Important: Expo SDK Version

**Ludi is on Expo SDK 52.** Some vendored Expo skills may reference newer SDK APIs (SDK 56+), such as:
- `@expo/ui` components
- `Color` from expo-router
- `expo-audio` (which replaces `expo-av` in later SDKs)

**When working on this codebase, prefer patterns compatible with Expo SDK 52 and the existing dependencies:**
- Use `expo-av` (not `expo-audio`)
- Use `react-native-svg` for board rendering
- Follow SDK 52 patterns from official Expo documentation when vendor skills reference newer APIs
