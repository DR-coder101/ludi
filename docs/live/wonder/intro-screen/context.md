# Ludi Live TikTok Overlay - Intro Screen

- Wonder dataNodeId: `ape` (file 01a1280f-1b74-77f2-96d4-e2a6357d0791, page 01a1280f-1b76-78f9-a694-c24ae2ca8fa8)
- Status: Required
- Canvas: 1080 x 1920 px (artboard placed at canvas x=9380, y=0). Rendered root height: 1920 px.
- Positions below are in artboard px (top-left origin), measured by rendering `code.jsx` at 1080x1920 (DPR 1) in Chrome with Tailwind v4 + Baloo 2. The render was checked visually against `wonder-screenshot.png` (Wonder native capture).
- `screenshot.png` = 1080x1920 local render of code.jsx; `wonder-screenshot.png` = Wonder take_screenshot (max size Wonder returns). If they ever differ, Wonder is the source of truth.
- Tailwind note: Wonder classes `tracking-N` mean letter-spacing N*4px (e.g. tracking-1.5 = 6px) and `drop-shadow-[...]` are hard (0 blur) offset drop shadows; Tailwind v4 does not apply them out of the box, the render patched them.

## Fonts used (family, weight, size)

| Family | Weight | Size | Example |
|---|---|---|---|
| Baloo 2 | 900 | 230px | LUDI |
| Baloo 2 | 900 | 150px | LIVE |
| Baloo 2 | 900 | 40px | STARTING SOON |
| Baloo 2 | 700 | 36px | by StreamArchitect |
| Baloo 2 | 900 | 34px | Jamaican Ludi • Live on TikTok |

## Colours (hex literals in code, by frequency)

`#fed100` x12, `#009b3a` x4, `#0b2a1a` x2, `#111111` x2, `#0b0b0c` x2, `#f6efd9` x2, `#0a0f0bb8` x2, `#fed100b3` x2, `#0a0f0bc7` x2, `#ff3b7f` x2

## Text strings (verbatim, in document order)

- "LUDI"  (Intro Wordmark Ludi, `ape.ups`)
- "LIVE"  (Intro Wordmark Live, `ape.ayu`)
- "by StreamArchitect"  (Intro By StreamArchitect, `ape.sis`)
- "Jamaican Ludi • Live on TikTok"  (Intro Tagline Pill, `ape.cab`)
- "STARTING SOON"  (Starting Soon Text, `ape.con`)

## Layout and styles per element

Indented by nesting depth. Format: label `id` x,y wxh | styles.

- Ludi Live TikTok Overlay - Intro Screen `ape` 0,0 1080x1920 | bg rgb(11, 42, 26)
  - Background Photo Layer - Swap For Jamaica Photo `ape.are` 0,0 1080x1920
    - Backdrop Photo - Dean Beach Sunset `ape.fra` 0,0 1080x1920 | bgImage url("https://cdn.wonder.so/images/01a1280f-1b74-77f2-96d4-e2a6357d0791/6ce5af0a0c352c962402e1cfb6dc61b86eab816aa50a391599881ca2f64f6e9c.jpg")
    - Cinematic Light Tint `ape.wed` 0,0 1080x1920 | bgImage linear-gradient(rgba(4, 6, 5, 0.45) 0%, rgba(4, 6, 5, 0.1) 22%, rgba(4, 6, 5, 0) 40%, rgba(4, 6, 5, 0) 70%, rgba(4, 6, 5, 0.35) 100%)
    - Cinematic Edge Vignette `ape.zax` 0,0 1080x1920 | bgImage radial-gradient(circle, rgba(4, 6, 5, 0) 55%, rgba(4, 6, 5, 0.4) 100%)
  - Intro Logo Skeleton `ape.nav` 100,200 880x741
    - Intro Cinematic Logo `ape.ova` 100,200 880x741
      - Logo Soft Dark Halo `ape.aly` 140,200 800x560 | radius 3.35544e+07px; bgImage radial-gradient(circle, rgba(4, 6, 5, 0.62) 0%, rgba(4, 6, 5, 0.35) 45%, rgba(4, 6, 5, 0) 72%)
      - SVG `ape.roy` 455,220 169x169 | filter drop-shadow(rgb(17, 17, 17) 0px 8px 0px)
      - Intro Wordmark Ludi `ape.ups` 286,386 508x189 text "LUDI" | font "Baloo 2" 900 230px/188.6px ls 4px color rgb(254, 209, 0); filter drop-shadow(rgb(17, 17, 17) 0px 10px 0px)
      - Intro Wordmark Live `ape.ayu` 354,581 372x135 text "LIVE" | font "Baloo 2" 900 150px/135px ls 18px color rgb(255, 255, 255); filter drop-shadow(rgb(17, 17, 17) 0px 8px 0px)
      - Intro Jamaica Flag Stripe `ape.str` 280,736 520x16 | border 3px solid rgb(17, 17, 17); radius 3.35544e+07px
        - Intro Stripe Green `ape.its` 283,739 103x10 | bg rgb(0, 155, 58)
        - Intro Stripe Gold `ape.say` 386,739 103x10 | bg rgb(254, 209, 0)
        - Intro Stripe Black `ape.per` 489,739 103x10 | bg rgb(11, 11, 12)
        - Intro Stripe Gold Two `ape.one` 591,739 103x10 | bg rgb(254, 209, 0)
        - Intro Stripe Green Two `ape.can` 694,739 103x10 | bg rgb(0, 155, 58)
      - Intro By StreamArchitect `ape.sis` 384,770 313x54 text "by StreamArchitect" | font "Baloo 2" 700 36px/54px ls normal color rgb(246, 239, 217); filter drop-shadow(rgb(17, 17, 17) 0px 3px 0px)
      - Intro Tagline Pill `ape.cab` 279,840 521x71 text "Jamaican Ludi • Live on TikTok" | font "Baloo 2" 900 34px/51px ls normal color rgb(255, 255, 255); bg rgba(10, 15, 11, 0.72); border 2px solid rgba(254, 209, 0, 0.7); radius 3.35544e+07px
  - Intro Sun Window `ape.pdf` 100,941 880x260
  - Intro Starting Soon Skeleton `ape.god` 100,1201 880x94
    - Starting Soon Pill `ape.usd` 299,1201 483x94 | bg rgba(10, 15, 11, 0.78); border 3px solid rgb(254, 209, 0); radius 3.35544e+07px
      - Starting Soon Live Dot `ape.her` 336,1237 22x22 | bg rgb(255, 59, 127); radius 3.35544e+07px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 59, 127, 0.9) 0px 0px 16px 0px
      - Starting Soon Text `ape.con` 374,1218 371x60 text "STARTING SOON" | font "Baloo 2" 900 40px/60px ls 6px color rgb(254, 209, 0)

## Raw Tailwind classes

Exact classes are in `code.jsx` (Wonder get_element_code output, unmodified).
