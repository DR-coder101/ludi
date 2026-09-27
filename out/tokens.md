# Ludi design tokens: "Jamaican street / dancehall, premium" (DRAFT v1)

Source mockups: `home.png`, `lobby.png`, `board-start.png`, `board-midgame.png`, `win.png` (390×844 pt @3x).
HTML/SVG sources are in `/workspace/ludi-ui-draft/build/`. `lib.js` has the exact board geometry and piece drawing code.

## Colour
| Token | Hex | Use |
|---|---|---|
| `bg` | `#0B0B0C` | App background, board base |
| `surface` | `#141416` → `#18181B` | Cards, rails (top→bottom gradient) |
| `surfaceLine` | `rgba(255,255,255,0.08)` | Hairline borders |
| `cream` | `#F6EFD9` | Primary text, board grid lines (75% opacity) |
| `textMuted` | `rgba(246,239,217,0.65)` | Secondary text |
| `green` | `#009B3A` | Jamaica green (brand, stripes, success, Sign Up) |
| `greenDeep` | `#006B28` | Hard poster shadow under gold type |
| `greenBright` | `#19C45A` | Green used as text or accent on black (Ocho Rios) |
| `gold` | `#FED100` | Jamaica gold (primary CTA, wordmark, highlights) |
| `goldDeep` | `#C9A200` / `#E0B800` | CTA gradient end, pressed state |
| `red` | `#E4202E` (text `#FF3340`) | Kingston |
| `silver` | `#D9DCE1` | Negril accent (black pieces need a light rim or label colour) |
| `hot` | `#FF3B7F` | Restrained dancehall accent: LIVE badge, unread count, "+6" tag, stickers, capture burst. Keep it under ~3% of any screen |

### Places (corner → colour)
| Place | Corner | Piece | Accent | Home column | Start star |
|---|---|---|---|---|---|
| MONTEGO BAY | top-left | gold `#FED100` | `#FED100` | top arm, middle col (col 9, rows 1–7) | (r1, c8) |
| OCHO RIOS | top-right | green `#0FAE47` | `#19C45A` | right arm, middle row (row 9, cols 11–17) | (r8, c17) |
| KINGSTON | bottom-right | red `#E4202E` | `#FF3340` | bottom arm, middle col (col 9, rows 11–17) | (r17, c10) |
| NEGRIL | bottom-left | black `#26272B` | `#D9DCE1` | left arm, middle row (row 9, cols 1–7) | (r10, c1) |

Movement runs counter-clockwise, matching the shipped game's home columns. The entry arrow sits on the arm's end cell: (0,9), (9,18), (18,9), (9,0).
Mini-map pins use lon/lat projected onto the island: Negril 18.268,-78.348 · Montego Bay 18.476,-77.893 · Ocho Rios 18.407,-77.103 · Kingston 17.997,-76.794.

### Piece gradients (radial, light source top-left at 38%/32%)
- gold `#FFF3A0 → #FED100 → #A88400`, rim `#FFF8D0`
- green `#7CF2A4 → #0FAE47 → #005C22`, rim `#D8FFE6`
- red `#FF9AA0 → #E4202E → #7A0710`, rim `#FFE0E2`
- black `#7A7D84 → #26272B → #050506`, rim `#C9CDD4`
- Stack look: a darker base disc offset +0.28r on y, an inner groove ring at 0.62r, a specular ellipse on top, and a soft drop shadow. When two or more pieces share a cell, show a hot-pink count badge.

## Board (19×19)
- Cell = board width / 19 (≈19.7 pt on a 374 pt board). Board frame: 4 pt black bevel, 10 pt radius, 1 pt gold hairline at 25%.
- Yards 8×8 in the corners: black base, faint 5% grid (keeps the 19×19 readable), accent-colour halftone washing out from the outer corner, speaker-cone rings, a 1.6 pt accent frame inset 5 (2.6 pt plus glow for the current turn), and a dashed inner frame.
- Yard content: place name in stacked Anton (19.5 pt for two lines, 20–24 pt for one), a mini Jamaica map with a pin, a video tile (57×70, 7 pt radius, accent border), and 4 home slots along the bottom.
- Arms are 3×8. Track cells stripe outward from the end cell in the order green, black, gold, black (halftone at 10%). The home column is a solid place colour with chevrons pointing to the centre and a thin inner outline.
- Centre 3×3 is the Jamaican flag (green top and bottom, black left and right, gold saltire) with the island silhouette outlined in gold. A 2.6 pt band on each edge in the colour of the home column that enters there.
- Start cells get a star badge in the place colour. Entry arrows are black circles with an accent arrow.

## Typography (all free Google Fonts)
- **Anton**: display and poster type. Wordmark 168 pt, headings 20–34 pt, button labels 21–25 pt, letter-spacing +0.5–2 pt, always uppercase. Signature hard shadow: `2–9px` offset in `greenDeep`/`green`, sometimes with a black offset first.
- **Inter**: UI and body text. 12–13 pt at weight 500 for body, 600–700 for labels, 10–11 pt rail labels.
- **Archivo Black**: stickers, badges, kickers and pill buttons. 8–13 pt uppercase, letter-spacing 1–3 pt.

## Shape and spacing
- Radii: circle buttons 50% (48 pt rail, 42 pt top bar). Cards 18–20. Winner card 24. Buttons 14–18. Chips and pills are fully rounded. Code tiles 10. Board 10 outer, 6 inner.
- Screen padding 16 pt. Card gap 10–12 pt. Rails are 64 pt wide, 10 pt in from the edges.
- Elevation: `0 10–24px 26–60px rgba(0,0,0,.6–.8)`. Gold CTAs add `0 12px 30px rgba(254,209,0,.25)` plus a 1 px inner top highlight.
- Textures: film grain overlay (fractal noise at 22%, overlay blend), halftone dots (6 pt grid, 1.1 pt dot), a very faint marble layer (≤22%), speaker cone (home hero), and green/gold sunburst rays (win).
- Stickers sit rotated −7° to +12° with a hard 2–3 px black offset shadow. Use at most 2 per screen.

## Motion and haptics (proposed)
| Moment | Motion | Haptic |
|---|---|---|
| Piece slide | Hops cell by cell, 110 ms per cell, ease-out-quad, 1.08 scale bounce mid-hop, shadow shrinks at peak | Light impact on each landing (`Haptics.impactAsync(Light)`) |
| Enter track (on a 6) | Pops from the yard slot to the start star: 260 ms spring (damping 14) | Medium impact |
| Dice roll | 600–750 ms: 3D tumble (rotateX/Y), 2 bounces, face settles with a 120 ms overshoot. Rail dice button pulses gold while waiting | Selection ticks during the tumble, then medium impact on settle; success notification on a 6 |
| Legal-move highlight | Gold ring pulses 1.0→1.15 scale and 100→40% opacity on a 900 ms loop. Path dots fade in along the route (40 ms stagger). Destination cell glows | none |
| Current turn | Yard frame glow breathes on a 1.6 s loop. The avatar timer ring counts down (gold, turning hot pink under 5 s) | Light tick at 5 s left |
| Capture burst | 12-ray hot-pink burst plus confetti in the captured colour, 350 ms. The captured piece flies back to its yard along an arc (450 ms) | Heavy impact, then a warning notification for the captured player |
| Piece home | Piece shrinks into the centre triangle with a gold flash; the flag triangle shimmers | Success notification |
| Win | Poster card slams in (scale 1.15→1, 280 ms spring), rays rotate slowly (40 s per turn), confetti for 2.5 s, BIG UP sticker drops in 200 ms later | Success notification ×2 |
| Buttons | Press scale 0.97, 90 ms. Gold CTA darkens to `goldDeep` | Light impact |

Respect Reduce Motion: replace hops with a 200 ms cross-fade and turn off rays and confetti.
