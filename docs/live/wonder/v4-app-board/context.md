# Ludi Live TikTok Overlay v4 - App Board

- Wonder dataNodeId: `fit` (file 01a1280f-1b74-77f2-96d4-e2a6357d0791, page 01a1280f-1b76-78f9-a694-c24ae2ca8fa8)
- Status: Required
- Canvas: 1080 x 1920 px (artboard placed at canvas x=5660, y=0). Rendered root height: 1920 px.
- Positions below are in artboard px (top-left origin), measured by rendering `code.jsx` at 1080x1920 (DPR 1) in Chrome with Tailwind v4 + Baloo 2. The render was checked visually against `wonder-screenshot.png` (Wonder native capture).
- `screenshot.png` = 1080x1920 local render of code.jsx; `wonder-screenshot.png` = Wonder take_screenshot (max size Wonder returns). If they ever differ, Wonder is the source of truth.
- Tailwind note: Wonder classes `tracking-N` mean letter-spacing N*4px (e.g. tracking-1.5 = 6px) and `drop-shadow-[...]` are hard (0 blur) offset drop shadows; Tailwind v4 does not apply them out of the box, the render patched them.

## Fonts used (family, weight, size)

| Family | Weight | Size | Example |
|---|---|---|---|
| Baloo 2 | 900 | 96px | TURN! |
| Baloo 2 | 900 | 80px | @DAVE’S |
| Baloo 2 | 900 | 70px | LUDI LIVE |
| Baloo 2 | 900 | 44px | @Dave |
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

`#111111` x30, `#fed100` x24, `#0a0f0be0` x12, `#f3e7c9` x10, `#e4202e` x8, `#009b3a` x4, `#0b2a1a` x2, `#ffe0e2` x2, `#11111166` x2, `#fff6e3` x2, `#ff3340` x2, `#19c45a` x2, `#0fae47` x2, `#d9dce1` x2, `#26272b` x2, `#00000080` x2, `#7a0710` x2, `#ff3b6b` x2

## Text strings (verbatim, in document order)

- "LUDI LIVE"  (Ludi Live Wordmark, `fit.tom`)
- "by StreamArchitect · Game #24"  (By StreamArchitect Mark, `fit.rim`)
- "NEXT: @Tom +1 · !join"  (Join Queue Text, `fit.ace`)
- "WINNER STAYS"  (Winner Stays Text, `fit.els`)
- "TURN"  (Current Turn Label, `fit.cee`)
- "@Dave"  (Current Turn Player, `fit.six`)
- "00:18"  (Turn Timer Text, `fit.roe`)
- "Type"  (Command Hint Label, `fit.fro`)
- "!roll"  (Roll Command Chip, `fit.leo`)
- "then"  (Command Hint Then, `fit.mod`)
- "!move 1-4"  (Move Command Chip, `fit.usa`)
- "@Dave"  (Red Player Name, `fit.sic`)
- "2 out"  (Red Player Out Count, `fit.who`)
- "@Mike"  (Green Player Name, `fit.pda`)
- "2 out"  (Green Player Out Count, `fit.pty`)
- "@Sarah"  (Yellow Player Name, `fit.job`)
- "2 out"  (Gold Player Out Count, `fit.pit`)
- "@John"  (Blue Player Name, `fit.era`)
- "3 out"  (Black Player Out Count, `fit.leg`)
- "@DAVE’S"  (Turn Card Name, `fit.can`)
- "TURN!"  (Turn Card Turn Word, `fit.ler`)
- "type !roll"  (Turn Card Hint, `fit.bey`)
- "@Dave knocked @Sarah home!"  (Capture Event Text, `fit.two`)
- "@Lucy sent Rose x6"  (Gift Pop Text, `fit.bor`)

## Layout and styles per element

Indented by nesting depth. Format: label `id` x,y wxh | styles.

- Ludi Live TikTok Overlay v4 - App Board `fit` 0,0 1080x1920 | bg rgb(11, 42, 26)
  - Background Photo Layer - Swap For Jamaica Photo `fit.sam` 0,0 1080x1920
    - Backdrop Photo - Dean Beach Sunset `fit.nhs` 0,0 1080x1920 | bgImage url("https://cdn.wonder.so/images/01a1280f-1b74-77f2-96d4-e2a6357d0791/6ce5af0a0c352c962402e1cfb6dc61b86eab816aa50a391599881ca2f64f6e9c.jpg")
    - Backdrop Readability Vertical Tint `fit.men` 0,0 1080x1920 | bgImage linear-gradient(rgba(6, 10, 8, 0.15) 0%, rgba(6, 10, 8, 0.4) 9%, rgba(6, 10, 8, 0.6) 20%, rgba(6, 10, 8, 0.64) 60%, rgba(6, 10, 8, 0.4) 74%, rgba(6, 10, 8, 0.12) 100%)
    - Backdrop Readability Centre Vignette `fit.per` 0,0 1080x1920 | bgImage radial-gradient(circle, rgba(6, 10, 8, 0.45) 0%, rgba(6, 10, 8, 0.25) 60%, rgba(6, 10, 8, 0) 100%)
  - Title Card Row `fit.pdt` 100,60 880x123
    - Ludi Live Title Card `fit.dam` 100,60 644x123 | bg rgba(10, 15, 11, 0.88); border 3px solid rgb(254, 209, 0); radius 24px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(122, 74, 18) 0px 6px 0px 0px
      - SVG `fit.our` 119,91 60x60
        - SVG `fit.sri` 119,91 60x60
          - SVG `fit.yid` 119,91 60x60
      - Title Text Stack `fit.gez` 189,75 329x93
        - Ludi Live Wordmark `fit.tom` 189,75 304x63 text "LUDI LIVE" | font "Baloo 2" 900 70px/63px ls normal color rgb(254, 209, 0)
        - Brand Byline Row `fit.ley` 189,138 329x30
          - Jamaica Stripe Accent `fit.etc` 189,150 48x7 | radius 3.35544e+07px
            - Stripe Green `fit.kol` 189,150 16x7 | bg rgb(0, 155, 58)
            - Stripe Gold `fit.tyt` 205,150 16x7 | bg rgb(254, 209, 0)
            - Stripe Black `fit.ink` 221,150 16x7 | bg rgb(17, 17, 17)
          - By StreamArchitect Mark `fit.rim` 245,138 273x30 text "by StreamArchitect · Game #24" | font "Baloo 2" 600 20px/30px ls normal color rgb(243, 231, 201)
    - Game Badges Stack `fit.sql` 760,71 220x102
      - Join Queue Badge `fit.mix` 752,71 237x43 | bg rgb(0, 155, 58); border 2px solid rgb(17, 17, 17); radius 12px
        - SVG `fit.oda` 766,82 20x20
          - SVG `fit.elm` 766,82 20x20
        - Join Queue Text `fit.ace` 792,78 183x29 text "NEXT: @Tom +1 · !join" | font "Baloo 2" 900 19px/28.5px ls normal color rgb(255, 255, 255)
      - Winner Stays Badge `fit.bid` 765,116 209x63 | bg rgb(254, 209, 0); border 3px solid rgb(17, 17, 17); radius 3.35544e+07px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(17, 17, 17) 0px 4px 0px 0px
        - SVG `fit.zad` 783,142 21x21
          - SVG `fit.sub` 783,142 20x21
            - SVG `fit.may` 783,142 20x21
        - Winner Stays Text `fit.els` 809,125 148x43 text "WINNER STAYS" | font "Baloo 2" 900 22px/33px ls normal color rgb(17, 17, 17)
  - Turn Row `fit.goo` 100,197 880x139
    - Current Turn Panel `fit.one` 100,197 880x139 | bg rgb(228, 32, 46); border 4px solid rgb(255, 224, 226); radius 22px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(228, 32, 46, 0.95) 0px 0px 36px 0px, rgb(17, 17, 17) 0px 6px 0px 0px
      - Turn Info Stack `fit.kit` 124,213 710x107
        - Turn Name Row `fit.ara` 124,213 710x44
          - Current Turn Label `fit.cee` 124,219 70x32 text "TURN" | font "Baloo 2" 900 20px/30px ls normal color rgb(254, 209, 0); bg rgb(17, 17, 17); radius 8px
          - Current Turn Player `fit.six` 206,213 148x44 text "@Dave" | font "Baloo 2" 900 44px/44px ls normal color rgb(255, 255, 255)
          - Turn Timer Row `fit.zoa` 724,219 110x32
            - SVG `fit.geo` 724,222 26x26
              - SVG `fit.cgi` 724,222 26x26
                - SVG `fit.was` 724,222 26x26
            - Turn Timer Text `fit.roe` 756,219 78x32 text "00:18" | font "Baloo 2" 900 32px/32px ls normal color rgb(255, 255, 255)
        - Turn Timer Track `fit.dun` 124,263 710x10 | bg rgba(17, 17, 17, 0.4); radius 3.35544e+07px
          - Turn Timer Fill `fit.yot` 124,263 426x10 | bg rgb(254, 209, 0); radius 3.35544e+07px
        - Command Hint Row `fit.yep` 124,279 710x41
          - Command Hint Label `fit.fro` 124,283 48x33 text "Type" | font "Baloo 2" 700 22px/33px ls normal color rgb(255, 255, 255)
          - Roll Command Chip `fit.leo` 180,279 72x41 text "!roll" | font "Baloo 2" 900 26px/39px ls normal color rgb(17, 17, 17); bg rgb(254, 209, 0); radius 10px
          - Command Hint Then `fit.mod` 260,283 46x33 text "then" | font "Baloo 2" 700 22px/33px ls normal color rgb(255, 255, 255)
          - Move Command Chip `fit.usa` 314,279 138x41 text "!move 1-4" | font "Baloo 2" 900 26px/39px ls normal color rgb(17, 17, 17); bg rgb(255, 255, 255); radius 10px
      - Dice Result Die `fit.pci` 845,208 117x117 | bg rgb(255, 246, 227); border 4px solid rgb(17, 17, 17); radius 20px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(17, 17, 17) 0px 6px 0px 0px
        - Die Top Pips `fit.mah` 873,228 70x27
          - Die Pip Top Left `fit.mal` 873,228 20x20 | bg rgb(17, 17, 17); radius 3.35544e+07px
          - Die Pip Top Right `fit.wye` 922,235 20x20 | bg rgb(17, 17, 17); radius 3.35544e+07px
        - Die Middle Pips `fit.oem` 869,253 70x27
          - Die Pip Centre `fit.how` 894,256 20x20 | bg rgb(228, 32, 46); radius 3.35544e+07px
        - Die Bottom Pips `fit.had` 866,278 70x27
          - Die Pip Bottom Left `fit.too` 866,278 20x20 | bg rgb(17, 17, 17); radius 3.35544e+07px
          - Die Pip Bottom Right `fit.why` 915,285 20x20 | bg rgb(17, 17, 17); radius 3.35544e+07px
  - Player Tags Row `fit.ave` 100,350 880x52
    - Kingston Red Player Tag `fit.eos` 100,350 213x52 | bg rgba(10, 15, 11, 0.88); border 3px solid rgb(255, 51, 64); radius 14px
      - Kingston Red Colour Dot `fit.hon` 113,367 18x18 | bg rgb(228, 32, 46); border 2px solid rgb(255, 255, 255); radius 3.35544e+07px
      - Red Player Name `fit.sic` 139,361 112x30 text "@Dave" | font "Baloo 2" 900 24px/30px ls normal color rgb(255, 255, 255)
      - Red Player Out Count `fit.who` 259,363 41x27 text "2 out" | font "Baloo 2" 700 18px/27px ls normal color rgb(243, 231, 201)
    - Ocho Rios Green Player Tag `fit.due` 323,350 213x52 | bg rgba(10, 15, 11, 0.88); border 3px solid rgb(25, 196, 90); radius 14px
      - Ocho Rios Green Colour Dot `fit.art` 336,367 18x18 | bg rgb(15, 174, 71); border 2px solid rgb(255, 255, 255); radius 3.35544e+07px
      - Green Player Name `fit.pda` 362,361 112x30 text "@Mike" | font "Baloo 2" 900 24px/30px ls normal color rgb(255, 255, 255)
      - Green Player Out Count `fit.pty` 481,363 41x27 text "2 out" | font "Baloo 2" 700 18px/27px ls normal color rgb(243, 231, 201)
    - Montego Bay Gold Player Tag `fit.soa` 545,350 213x52 | bg rgba(10, 15, 11, 0.88); border 3px solid rgb(254, 209, 0); radius 14px
      - Montego Bay Gold Colour Dot `fit.low` 558,367 18x18 | bg rgb(254, 209, 0); border 2px solid rgb(255, 255, 255); radius 3.35544e+07px
      - Yellow Player Name `fit.job` 584,361 112x30 text "@Sarah" | font "Baloo 2" 900 24px/30px ls normal color rgb(255, 255, 255)
      - Gold Player Out Count `fit.pit` 704,363 41x27 text "2 out" | font "Baloo 2" 700 18px/27px ls normal color rgb(243, 231, 201)
    - Negril Black Player Tag `fit.keg` 768,350 213x52 | bg rgba(10, 15, 11, 0.88); border 3px solid rgb(217, 220, 225); radius 14px
      - Negril Black Colour Dot `fit.dev` 781,367 18x18 | bg rgb(38, 39, 43); border 2px solid rgb(255, 255, 255); radius 3.35544e+07px
      - Blue Player Name `fit.era` 807,361 112x30 text "@John" | font "Baloo 2" 900 24px/30px ls normal color rgb(255, 255, 255)
      - Black Player Out Count `fit.leg` 926,363 41x27 text "3 out" | font "Baloo 2" 700 18px/27px ls normal color rgb(243, 231, 201)
  - Board Row `fit.non` 100,416 880x862
    - App Ludi Board Holder `fit.com` 109,416 862x862
      - App Ludi Board Image - Wide Track Kingston Active `fit.oct` 120,427 840x840 | radius 10px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.8) 0px 16px 36px 0px; bgImage url("https://cdn.wonder.so/images/01a1280f-1b74-77f2-96d4-e2a6357d0791/5b63a90b37a285072155116353c3b80b0e17f52bb02b1ddd70b3cbb8437f7a8b.png")
    - Turn Card Board Scrim `fit.her` 120,427 840x840 | bg rgba(0, 0, 0, 0.5); radius 10px
    - Turn Name Card Popup `fit.css` 210,694 659x340 | bg rgb(228, 32, 46); border 6px solid rgb(255, 255, 255); radius 32px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(228, 32, 46, 0.95) 0px 0px 60px 0px, rgb(11, 11, 12) 0px 10px 0px 0px
      - Turn Card Top Row `fit.zac` 296,732 478x109
        - Turn Card Colour Dot `fit.but` 297,778 47x47 | bg rgb(122, 7, 16); border 6px solid rgb(255, 255, 255); radius 3.35544e+07px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(17, 17, 17) 0px 0px 0px 3px
        - Turn Card Name `fit.can` 356,737 346x100 text "@DAVE’S" | font "Baloo 2" 900 80px/76px ls normal color rgb(255, 255, 255)
        - SVG `fit.jat` 711,740 63x63
          - SVG `fit.waf` 711,740 63x63
      - Turn Card Turn Word `fit.ler` 404,825 275x105 text "TURN!" | font "Baloo 2" 900 96px/86.4px ls normal color rgb(254, 209, 0)
      - Turn Card Hint `fit.bey` 471,925 150x60 text "type !roll" | font "Baloo 2" 900 28px/42px ls normal color rgb(255, 255, 255); bg rgb(17, 17, 17); radius 3.35544e+07px
  - Event Line Row `fit.ltd` 100,1292 880x62
    - Capture Event Line `fit.you` 100,1294 577x59 | bg rgba(10, 15, 11, 0.88); radius 16px
      - SVG `fit.far` 116,1310 26x26
        - SVG `fit.iao` 116,1310 26x26
          - SVG `fit.fut` 116,1310 26x26
      - Capture Event Text `fit.two` 152,1304 374x39 text "@Dave knocked @Sarah home!" | font "Baloo 2" 900 26px/39px ls normal color rgb(255, 255, 255)
    - Gift Pop Line `fit.red` 688,1287 293x72 | bg rgb(255, 59, 107); border 3px solid rgb(17, 17, 17); radius 3.35544e+07px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(17, 17, 17) 0px 4px 0px 0px
      - SVG `fit.his` 708,1306 27x27
        - SVG `fit.nec` 708,1306 27x27
          - SVG `fit.mid` 708,1306 27x27
      - Gift Pop Text `fit.bor` 742,1302 220x44 text "@Lucy sent Rose x6" | font "Baloo 2" 900 24px/36px ls normal color rgb(255, 255, 255)

## Raw Tailwind classes

Exact classes are in `code.jsx` (Wonder get_element_code output, unmodified).
