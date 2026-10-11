# Ludi Live TikTok Overlay v4 - App Board Green

- Wonder dataNodeId: `way` (file 01a1280f-1b74-77f2-96d4-e2a6357d0791, page 01a1280f-1b76-78f9-a694-c24ae2ca8fa8)
- Status: Required
- Canvas: 1080 x 1920 px (artboard placed at canvas x=6900, y=0). Rendered root height: 1920 px.
- Positions below are in artboard px (top-left origin), measured by rendering `code.jsx` at 1080x1920 (DPR 1) in Chrome with Tailwind v4 + Baloo 2. The render was checked visually against `wonder-screenshot.png` (Wonder native capture).
- `screenshot.png` = 1080x1920 local render of code.jsx; `wonder-screenshot.png` = Wonder take_screenshot (max size Wonder returns). If they ever differ, Wonder is the source of truth.
- Tailwind note: Wonder classes `tracking-N` mean letter-spacing N*4px (e.g. tracking-1.5 = 6px) and `drop-shadow-[...]` are hard (0 blur) offset drop shadows; Tailwind v4 does not apply them out of the box, the render patched them.

## Fonts used (family, weight, size)

| Family | Weight | Size | Example |
|---|---|---|---|
| Baloo 2 | 900 | 96px | TURN! |
| Baloo 2 | 900 | 80px | @MIKE’S |
| Baloo 2 | 900 | 70px | LUDI LIVE |
| Baloo 2 | 900 | 44px | @Mike |
| Baloo 2 | 900 | 32px | 00:18 |
| Baloo 2 | 900 | 28px | type !roll |
| Baloo 2 | 900 | 26px | !roll |
| Baloo 2 | 900 | 24px | @Dave |
| Baloo 2 | 900 | 22px | WINNER STAYS |
| Baloo 2 | 700 | 22px | Type |
| Baloo 2 | 600 | 20px | by StreamArchitect · Game #24 |
| Baloo 2 | 900 | 20px | TURN |
| Baloo 2 | 900 | 19px | NEXT: @Tom +1 · !join |
| Baloo 2 | 700 | 18px | 2 out |

## Colours (hex literals in code, by frequency)

`#111111` x30, `#fed100` x24, `#0a0f0be0` x12, `#f3e7c9` x10, `#0fae47` x8, `#009b3a` x4, `#0b2a1a` x2, `#d8ffe6` x2, `#11111166` x2, `#fff6e3` x2, `#ff3340` x2, `#e4202e` x2, `#19c45a` x2, `#d9dce1` x2, `#26272b` x2, `#00000080` x2, `#005c22` x2, `#ff3b6b` x2

## Text strings (verbatim, in document order)

- "LUDI LIVE"  (Ludi Live Wordmark, `way.ict`)
- "by StreamArchitect · Game #24"  (By StreamArchitect Mark, `way.poe`)
- "NEXT: @Tom +1 · !join"  (Join Queue Text, `way.tez`)
- "WINNER STAYS"  (Winner Stays Text, `way.yip`)
- "TURN"  (Current Turn Label, `way.pit`)
- "@Mike"  (Current Turn Player, `way.apr`)
- "00:18"  (Turn Timer Text, `way.sir`)
- "Type"  (Command Hint Label, `way.eta`)
- "!roll"  (Roll Command Chip, `way.sat`)
- "then"  (Command Hint Then, `way.kaw`)
- "!move 1-4"  (Move Command Chip, `way.wet`)
- "@Dave"  (Red Player Name, `way.roy`)
- "2 out"  (Red Player Out Count, `way.doc`)
- "@Mike"  (Green Player Name, `way.gnu`)
- "2 out"  (Green Player Out Count, `way.air`)
- "@Sarah"  (Yellow Player Name, `way.icy`)
- "2 out"  (Gold Player Out Count, `way.haw`)
- "@John"  (Blue Player Name, `way.tst`)
- "3 out"  (Black Player Out Count, `way.bur`)
- "@MIKE’S"  (Turn Card Name, `way.lod`)
- "TURN!"  (Turn Card Turn Word, `way.jan`)
- "type !roll"  (Turn Card Hint, `way.tag`)
- "@Dave knocked @Sarah home!"  (Capture Event Text, `way.are`)
- "@Lucy sent Rose x6"  (Gift Pop Text, `way.urw`)

## Layout and styles per element

Indented by nesting depth. Format: label `id` x,y wxh | styles.

- Ludi Live TikTok Overlay v4 - App Board Green `way` 0,0 1080x1920 | bg rgb(11, 42, 26)
  - Background Photo Layer - Swap For Jamaica Photo `way.was` 0,0 1080x1920
    - Backdrop Photo - Dean Beach Sunset `way.one` 0,0 1080x1920 | bgImage url("https://cdn.wonder.so/images/01a1280f-1b74-77f2-96d4-e2a6357d0791/6ce5af0a0c352c962402e1cfb6dc61b86eab816aa50a391599881ca2f64f6e9c.jpg")
    - Backdrop Readability Vertical Tint `way.bid` 0,0 1080x1920 | bgImage linear-gradient(rgba(6, 10, 8, 0.15) 0%, rgba(6, 10, 8, 0.4) 9%, rgba(6, 10, 8, 0.6) 20%, rgba(6, 10, 8, 0.64) 60%, rgba(6, 10, 8, 0.4) 74%, rgba(6, 10, 8, 0.12) 100%)
    - Backdrop Readability Centre Vignette `way.fob` 0,0 1080x1920 | bgImage radial-gradient(circle, rgba(6, 10, 8, 0.45) 0%, rgba(6, 10, 8, 0.25) 60%, rgba(6, 10, 8, 0) 100%)
  - Title Card Row `way.etc` 100,60 880x123
    - Ludi Live Title Card `way.but` 100,60 644x123 | bg rgba(10, 15, 11, 0.88); border 3px solid rgb(254, 209, 0); radius 24px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(122, 74, 18) 0px 6px 0px 0px
      - SVG `way.ali` 119,91 60x60
        - SVG `way.cia` 119,91 60x60
          - SVG `way.win` 119,91 60x60
            - SVG `way.has` 119,91 60x60
      - Title Text Stack `way.ext` 189,75 329x93
        - Ludi Live Wordmark `way.ict` 189,75 304x63 text "LUDI LIVE" | font "Baloo 2" 900 70px/63px ls normal color rgb(254, 209, 0)
        - Brand Byline Row `way.yet` 189,138 329x30
          - Jamaica Stripe Accent `way.inn` 189,150 48x7 | radius 3.35544e+07px
            - Stripe Green `way.val` 189,150 16x7 | bg rgb(0, 155, 58)
            - Stripe Gold `way.los` 205,150 16x7 | bg rgb(254, 209, 0)
            - Stripe Black `way.aho` 221,150 16x7 | bg rgb(17, 17, 17)
          - By StreamArchitect Mark `way.poe` 245,138 273x30 text "by StreamArchitect · Game #24" | font "Baloo 2" 600 20px/30px ls normal color rgb(243, 231, 201)
    - Game Badges Stack `way.fon` 760,71 220x102
      - Join Queue Badge `way.fra` 752,71 237x43 | bg rgb(0, 155, 58); border 2px solid rgb(17, 17, 17); radius 12px
        - SVG `way.img` 766,82 20x20
          - SVG `way.dir` 766,82 20x20
            - SVG `way.osc` 766,82 20x20
        - Join Queue Text `way.tez` 792,78 183x29 text "NEXT: @Tom +1 · !join" | font "Baloo 2" 900 19px/28.5px ls normal color rgb(255, 255, 255)
      - Winner Stays Badge `way.our` 765,116 209x63 | bg rgb(254, 209, 0); border 3px solid rgb(17, 17, 17); radius 3.35544e+07px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(17, 17, 17) 0px 4px 0px 0px
        - SVG `way.rss` 783,142 21x21
          - SVG `way.lea` 783,142 20x21
            - SVG `way.max` 783,142 20x21
              - SVG `way.yew` 783,142 20x21
        - Winner Stays Text `way.yip` 809,125 148x43 text "WINNER STAYS" | font "Baloo 2" 900 22px/33px ls normal color rgb(17, 17, 17)
  - Turn Row `way.jul` 100,197 880x139
    - Current Turn Panel `way.www` 100,197 880x139 | bg rgb(15, 174, 71); border 4px solid rgb(216, 255, 230); radius 22px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(15, 174, 71, 0.95) 0px 0px 36px 0px, rgb(17, 17, 17) 0px 6px 0px 0px
      - Turn Info Stack `way.gun` 124,213 710x107
        - Turn Name Row `way.her` 124,213 710x44
          - Current Turn Label `way.pit` 124,219 70x32 text "TURN" | font "Baloo 2" 900 20px/30px ls normal color rgb(254, 209, 0); bg rgb(17, 17, 17); radius 8px
          - Current Turn Player `way.apr` 206,213 142x44 text "@Mike" | font "Baloo 2" 900 44px/44px ls normal color rgb(255, 255, 255)
          - Turn Timer Row `way.job` 724,219 110x32
            - SVG `way.edo` 724,222 26x26
              - SVG `way.who` 724,222 26x26
                - SVG `way.tcp` 724,222 26x26
                  - SVG `way.two` 724,222 26x26
            - Turn Timer Text `way.sir` 756,219 78x32 text "00:18" | font "Baloo 2" 900 32px/32px ls normal color rgb(255, 255, 255)
        - Turn Timer Track `way.sen` 124,263 710x10 | bg rgba(17, 17, 17, 0.4); radius 3.35544e+07px
          - Turn Timer Fill `way.fed` 124,263 426x10 | bg rgb(254, 209, 0); radius 3.35544e+07px
        - Command Hint Row `way.rfc` 124,279 710x41
          - Command Hint Label `way.eta` 124,283 48x33 text "Type" | font "Baloo 2" 700 22px/33px ls normal color rgb(255, 255, 255)
          - Roll Command Chip `way.sat` 180,279 72x41 text "!roll" | font "Baloo 2" 900 26px/39px ls normal color rgb(17, 17, 17); bg rgb(254, 209, 0); radius 10px
          - Command Hint Then `way.kaw` 260,283 46x33 text "then" | font "Baloo 2" 700 22px/33px ls normal color rgb(255, 255, 255)
          - Move Command Chip `way.wet` 314,279 138x41 text "!move 1-4" | font "Baloo 2" 900 26px/39px ls normal color rgb(17, 17, 17); bg rgb(255, 255, 255); radius 10px
      - Dice Result Die `way.atm` 845,208 117x117 | bg rgb(255, 246, 227); border 4px solid rgb(17, 17, 17); radius 20px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(17, 17, 17) 0px 6px 0px 0px
        - Die Top Pips `way.pop` 873,228 70x27
          - Die Pip Top Left `way.jat` 873,228 20x20 | bg rgb(17, 17, 17); radius 3.35544e+07px
          - Die Pip Top Right `way.jug` 922,235 20x20 | bg rgb(17, 17, 17); radius 3.35544e+07px
        - Die Middle Pips `way.fri` 869,253 70x27
          - Die Pip Centre `way.can` 894,256 20x20 | bg rgb(15, 174, 71); radius 3.35544e+07px
        - Die Bottom Pips `way.lis` 866,278 70x27
          - Die Pip Bottom Left `way.bed` 866,278 20x20 | bg rgb(17, 17, 17); radius 3.35544e+07px
          - Die Pip Bottom Right `way.usa` 915,285 20x20 | bg rgb(17, 17, 17); radius 3.35544e+07px
  - Player Tags Row `way.cst` 100,350 880x52
    - Kingston Red Player Tag `way.ltd` 100,350 213x52 | bg rgba(10, 15, 11, 0.88); border 3px solid rgb(255, 51, 64); radius 14px
      - Kingston Red Colour Dot `way.day` 113,367 18x18 | bg rgb(228, 32, 46); border 2px solid rgb(255, 255, 255); radius 3.35544e+07px
      - Red Player Name `way.roy` 139,361 112x30 text "@Dave" | font "Baloo 2" 900 24px/30px ls normal color rgb(255, 255, 255)
      - Red Player Out Count `way.doc` 259,363 41x27 text "2 out" | font "Baloo 2" 700 18px/27px ls normal color rgb(243, 231, 201)
    - Ocho Rios Green Player Tag `way.pro` 323,350 213x52 | bg rgba(10, 15, 11, 0.88); border 3px solid rgb(25, 196, 90); radius 14px
      - Ocho Rios Green Colour Dot `way.dig` 336,367 18x18 | bg rgb(15, 174, 71); border 2px solid rgb(255, 255, 255); radius 3.35544e+07px
      - Green Player Name `way.gnu` 362,361 112x30 text "@Mike" | font "Baloo 2" 900 24px/30px ls normal color rgb(255, 255, 255)
      - Green Player Out Count `way.air` 481,363 41x27 text "2 out" | font "Baloo 2" 700 18px/27px ls normal color rgb(243, 231, 201)
    - Montego Bay Gold Player Tag `way.aam` 545,350 213x52 | bg rgba(10, 15, 11, 0.88); border 3px solid rgb(254, 209, 0); radius 14px
      - Montego Bay Gold Colour Dot `way.uro` 558,367 18x18 | bg rgb(254, 209, 0); border 2px solid rgb(255, 255, 255); radius 3.35544e+07px
      - Yellow Player Name `way.icy` 584,361 112x30 text "@Sarah" | font "Baloo 2" 900 24px/30px ls normal color rgb(255, 255, 255)
      - Gold Player Out Count `way.haw` 704,363 41x27 text "2 out" | font "Baloo 2" 700 18px/27px ls normal color rgb(243, 231, 201)
    - Negril Black Player Tag `way.jvc` 768,350 213x52 | bg rgba(10, 15, 11, 0.88); border 3px solid rgb(217, 220, 225); radius 14px
      - Negril Black Colour Dot `way.cet` 781,367 18x18 | bg rgb(38, 39, 43); border 2px solid rgb(255, 255, 255); radius 3.35544e+07px
      - Blue Player Name `way.tst` 807,361 112x30 text "@John" | font "Baloo 2" 900 24px/30px ls normal color rgb(255, 255, 255)
      - Black Player Out Count `way.bur` 926,363 41x27 text "3 out" | font "Baloo 2" 700 18px/27px ls normal color rgb(243, 231, 201)
  - Board Row `way.law` 100,416 880x862
    - App Ludi Board Holder `way.sea` 109,416 862x862
      - App Ludi Board Image - Wide Track Ocho Rios Active `way.buf` 120,427 840x840 | radius 10px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.8) 0px 16px 36px 0px; bgImage url("https://cdn.wonder.so/images/01a1280f-1b74-77f2-96d4-e2a6357d0791/b01e4982604e7ad4490e2e28cd5eca96fed8a3c346b1a8bb809d2e500e2f8167.png")
    - Turn Card Board Scrim `way.cwm` 120,427 840x840 | bg rgba(0, 0, 0, 0.5); radius 10px
    - Turn Name Card Popup `way.you` 213,699 655x329 | bg rgb(15, 174, 71); border 6px solid rgb(255, 255, 255); radius 32px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(15, 174, 71, 0.95) 0px 0px 60px 0px, rgb(11, 11, 12) 0px 10px 0px 0px
      - Turn Card Top Row `way.gan` 312,736 464x100
        - Turn Card Colour Dot `way.eve` 313,752 46x46 | bg rgb(0, 92, 34); border 6px solid rgb(255, 255, 255); radius 3.35544e+07px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(17, 17, 17) 0px 0px 0px 3px
        - Turn Card Name `way.lod` 372,739 332x93 text "@MIKE’S" | font "Baloo 2" 900 80px/76px ls normal color rgb(255, 255, 255)
        - SVG `way.pgp` 712,762 69x69
          - SVG `way.his` 712,762 69x69
            - SVG `way.pos` 712,762 69x69
      - Turn Card Turn Word `way.jan` 403,827 274x100 text "TURN!" | font "Baloo 2" 900 96px/86.4px ls normal color rgb(254, 209, 0)
      - Turn Card Hint `way.tag` 460,926 150x58 text "type !roll" | font "Baloo 2" 900 28px/42px ls normal color rgb(255, 255, 255); bg rgb(17, 17, 17); radius 3.35544e+07px
  - Event Line Row `way.mic` 100,1292 880x62
    - Capture Event Line `way.amy` 100,1294 577x59 | bg rgba(10, 15, 11, 0.88); radius 16px
      - SVG `way.bug` 116,1310 26x26
        - SVG `way.woy` 116,1310 26x26
          - SVG `way.buy` 116,1310 26x26
            - SVG `way.due` 116,1310 26x26
      - Capture Event Text `way.are` 152,1304 374x39 text "@Dave knocked @Sarah home!" | font "Baloo 2" 900 26px/39px ls normal color rgb(255, 255, 255)
    - Gift Pop Line `way.usb` 688,1287 293x72 | bg rgb(255, 59, 107); border 3px solid rgb(17, 17, 17); radius 3.35544e+07px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(17, 17, 17) 0px 4px 0px 0px
      - SVG `way.ope` 708,1306 27x27
        - SVG `way.una` 708,1306 27x27
          - SVG `way.thu` 708,1306 27x27
            - SVG `way.she` 708,1306 27x27
      - Gift Pop Text `way.urw` 742,1302 220x44 text "@Lucy sent Rose x6" | font "Baloo 2" 900 24px/36px ls normal color rgb(255, 255, 255)

## Raw Tailwind classes

Exact classes are in `code.jsx` (Wonder get_element_code output, unmodified).
