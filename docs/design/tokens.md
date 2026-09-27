# Design Tokens

## TOKENS

Colour: bg #0B0B0C; surface #141416 to #18181B gradient (cards, rails); surfaceLine rgba(255,255,255,0.08); cream #F6EFD9 (text, and board grid lines at 75%); textMuted rgba(246,239,217,0.65); green #009B3A; greenDeep #006B28 (hard poster shadow); greenBright #19C45A (green text on black, Ocho Rios); gold #FED100 (CTA, wordmark); goldDeep #C9A200; red #E4202E (text #FF3340); silver #D9DCE1 (Negril accent); hot #FF3B7F only for the LIVE badge, unread count, +6 tag, stickers and capture burst (under 3% of a screen).

Places: MONTEGO BAY top-left, piece gold #FED100, accent #FED100, home column top arm. OCHO RIOS top-right, piece #0FAE47, accent #19C45A, right arm. KINGSTON bottom-right, piece #E4202E, accent #FF3340, bottom arm. NEGRIL bottom-left, piece #26272B, accent #D9DCE1, left arm. Map these to the existing engine seats by board corner, without changing engine colour indices. Pins (lat,lon): Negril 18.268,-78.348; Montego Bay 18.476,-77.893; Ocho Rios 18.407,-77.103; Kingston 17.997,-76.794.

Piece gradients (radial, centre 38%/32%, r 75%, stops 0/.45/1): gold #FFF3A0/#FED100/#A88400 rim #FFF8D0; green #7CF2A4/#0FAE47/#005C22 rim #D8FFE6; red #FF9AA0/#E4202E/#7A0710 rim #FFE0E2; black #7A7D84/#26272B/#050506 rim #C9CDD4.

Type (use @expo-google-fonts): Anton for display (uppercase, tracking +0.5 to 2, hard shadow 2 to 9px in greenDeep); Inter for UI (body 12 to 13 at 500, labels 600 to 700); Archivo Black for stickers, badges and pills (8 to 13 uppercase, tracking 1 to 3).

Shape: rail buttons are 48pt circles, top-bar buttons 42pt; card radius 18 to 20; winner card 24; buttons 14 to 18; pills fully round. Screen padding 16, gaps 10 to 12. Gold CTAs get a gradient to goldDeep and a gold glow shadow. Stickers are rotated -7 to +12 degrees with a hard 2 to 3px black offset shadow, max 2 per screen. Textures: film grain, halftone dots (6pt grid, 1.1pt dot), speaker cone, sunburst rays.
