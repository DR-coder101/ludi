# Ludi Live TikTok Overlay - Winner Screen

- Wonder dataNodeId: `auk` (file 01a1280f-1b74-77f2-96d4-e2a6357d0791, page 01a1280f-1b76-78f9-a694-c24ae2ca8fa8)
- Status: Required
- Canvas: 1080 x 1920 px (artboard placed at canvas x=10620, y=0). Rendered root height: 1920 px.
- Positions below are in artboard px (top-left origin), measured by rendering `code.jsx` at 1080x1920 (DPR 1) in Chrome with Tailwind v4 + Baloo 2. The render was checked visually against `wonder-screenshot.png` (Wonder native capture).
- `screenshot.png` = 1080x1920 local render of code.jsx; `wonder-screenshot.png` = Wonder take_screenshot (max size Wonder returns). If they ever differ, Wonder is the source of truth.
- Tailwind note: Wonder classes `tracking-N` mean letter-spacing N*4px (e.g. tracking-1.5 = 6px) and `drop-shadow-[...]` are hard (0 blur) offset drop shadows; Tailwind v4 does not apply them out of the box, the render patched them.

## Fonts used (family, weight, size)

| Family | Weight | Size | Example |
|---|---|---|---|
| Baloo 2 | 900 | 170px | WINNER! |
| Baloo 2 | 900 | 150px | @DAVE |
| Baloo 2 | 900 | 56px | Kingston takes it! |
| Baloo 2 | 900 | 44px | !join |
| Baloo 2 | 900 | 42px | NEXT GAME: 3 SEATS OPEN · TYPE |
| Baloo 2 | 900 | 32px | 15s |
| Baloo 2 | 900 | 30px | WINNER CAN STAY |
| Baloo 2 | 700 | 28px | All 4 pieces home |
| Baloo 2 | 900 | 28px | STAY |
| Baloo 2 | 900 | 25px | @DAVE: type !stay to keep your seat |
| Baloo 2 | 900 | 24px | Next up: @Tom, @Lucy |
| Baloo 2 | 700 | 22px | pieces home |
| Baloo 2 | 700 | 20px | No reply in 15s = seat opens |

## Colours (hex literals in code, by frequency)

`#fed100` x30, `#111111` x26, `#19c45a` x12, `#d9dce1` x10, `#ffe0e2` x4, `#0a0f0bdb` x4, `#f3e7c9` x4, `#0b2a1a` x2, `#e4202e` x2, `#0a0f0be0` x2, `#ff3340` x2, `#ff9aa0` x2, `#1b1c20` x2, `#fed10099` x2, `#07140c` x2, `#d8ffe6` x2, `#141104` x2, `#fff8d0` x2, `#111214` x2, `#c9cdd4` x2, `#3a2c00` x2, `#0a0f0bb3` x2, `#fed10040` x1

## Text strings (verbatim, in document order)

- "WINNER!"  (Winner Headline, `auk.saw`)
- "@DAVE"  (Winner Player Name, `auk.law`)
- "Kingston takes it!"  (Winner Town Line, `auk.aix`)
- "All 4 pieces home"  (Winner Pieces Home Note, `auk.sql`)
- "WINNER CAN STAY"  (Winner Stays Badge Text, `auk.sea`)
- "15s"  (Choice Countdown Seconds, `auk.zoa`)
- "@DAVE: type !stay to keep your seat"  (Choice Prompt Line, `auk.own`)
- "No reply in 15s = seat opens"  (Choice Default Note, `auk.dib`)
- "STAY"  (Stay Choice Text, `auk.cue`)
- "LEAVE"  (Leave Choice Text, `auk.jan`)
- "RESULTS"  (Results Title, `auk.vhs`)
- "pieces home"  (Results Pieces Home Label, `auk.hyp`)
- "2nd"  (Ocho Rios Rank, `auk.bob`)
- "@Mike"  (Ocho Rios Result Player, `auk.hem`)
- "Ocho Rios · sitting out next game"  (Ocho Rios Result Town, `auk.bbc`)
- "3 home"  (Ocho Rios Home Count, `auk.eat`)
- "3rd"  (Montego Bay Rank, `auk.sia`)
- "@Sarah"  (Montego Bay Result Player, `auk.out`)
- "Montego Bay · sitting out next game"  (Montego Bay Result Town, `auk.pst`)
- "2 home"  (Montego Bay Home Count, `auk.dum`)
- "4th"  (Negril Rank, `auk.her`)
- "@John"  (Negril Result Player, `auk.can`)
- "Negril · sitting out next game"  (Negril Result Town, `auk.jar`)
- "1 home"  (Negril Home Count, `auk.isp`)
- "NEXT GAME: 3 SEATS OPEN · TYPE"  (Next Game Seats Text, `auk.lam`)
- "!join"  (Next Game Join Chip, `auk.zan`)
- "4 seats open if @Dave leaves or doesn’t reply"  (Next Game Leave Variant Note, `auk.did`)
- "Next up: @Tom, @Lucy"  (Next Up Text, `auk.but`)
- "Game #24 · by StreamArchitect"  (Game Credit Line, `auk.reb`)

## Layout and styles per element

Indented by nesting depth. Format: label `id` x,y wxh | styles.

- Ludi Live TikTok Overlay - Winner Screen `auk` 0,0 1080x1920 | bg rgb(11, 42, 26)
  - Background Photo Layer - Swap For Jamaica Photo `auk.rab` 0,0 1080x1920
    - Backdrop Photo - Dean Beach Sunset `auk.few` 0,0 1080x1920 | bgImage url("https://cdn.wonder.so/images/01a1280f-1b74-77f2-96d4-e2a6357d0791/6ce5af0a0c352c962402e1cfb6dc61b86eab816aa50a391599881ca2f64f6e9c.jpg")
    - Backdrop Moderate Tint `auk.buy` 0,0 1080x1920 | bgImage linear-gradient(rgba(6, 10, 8, 0.4) 0%, rgba(6, 10, 8, 0.3) 20%, rgba(6, 10, 8, 0.38) 40%, rgba(6, 10, 8, 0.55) 58%, rgba(6, 10, 8, 0.5) 72%, rgba(6, 10, 8, 0.22) 100%)
    - Winner Red Spotlight Glow `auk.dpi` 90,180 900x700 | radius 3.35544e+07px; bgImage radial-gradient(circle, rgba(228, 32, 46, 0.35) 0%, rgba(228, 32, 46, 0) 70%)
  - Confetti Streamers Layer `auk.pot` 0,0 1080x1500
    - SVG `auk.deg` 0,0 1080x1500
  - Winner Header Skeleton `auk.mal` 100,40 880x273
    - Winner Header `auk.wok` 188,40 705x273
      - SVG `auk.leg` 474,34 132x132 | filter drop-shadow(rgb(17, 17, 17) 0px 8px 0px)
      - Winner Headline `auk.saw` 188,160 705x153 text "WINNER!" | font "Baloo 2" 900 170px/153px ls 4px color rgb(254, 209, 0); filter drop-shadow(rgb(17, 17, 17) 0px 10px 0px)
  - Winner Card Skeleton `auk.you` 100,327 880x469
    - Winner Name Card `auk.eye` 124,313 831x367 | bg rgb(228, 32, 46); border 7px solid rgb(255, 255, 255); radius 40px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(228, 32, 46, 0.95) 0px 0px 80px 0px, rgb(17, 17, 17) 0px 12px 0px 0px
      - Winner Name Row `auk.toy` 214,353 647x165
        - Winner Kingston Piece `auk.bam` 215,395 99x99 | border 6px solid rgb(255, 224, 226); radius 3.35544e+07px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(122, 7, 16) 0px 8px 0px 0px, rgb(17, 17, 17) 0px 0px 0px 4px; bgImage radial-gradient(circle at 38% 32%, rgb(255, 154, 160) 0%, rgb(228, 32, 46) 45%, rgb(122, 7, 16) 100%)
        - Winner Player Name `auk.law` 332,353 529x161 text "@DAVE" | font "Baloo 2" 900 150px/142.5px ls normal color rgb(255, 255, 255); filter drop-shadow(rgb(17, 17, 17) 0px 8px 0px)
      - Winner Town Line Row `auk.lao` 288,508 507x74
        - SVG `auk.des` 288,530 46x46
        - Winner Town Line `auk.aix` 346,508 449x72 text "Kingston takes it!" | font "Baloo 2" 900 56px/56px ls normal color rgb(254, 209, 0); filter drop-shadow(rgb(17, 17, 17) 0px 4px 0px)
      - Winner Pieces Home Note `auk.sql` 434,579 219x50 text "All 4 pieces home" | font "Baloo 2" 700 28px/42px ls normal color rgb(255, 224, 226)
      - Winner Stays Badge `auk.are` 605,276 342x96 | bg rgb(254, 209, 0); border 4px solid rgb(17, 17, 17); radius 3.35544e+07px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(17, 17, 17) 0px 6px 0px 0px
        - SVG `auk.dec` 633,299 32x32
        - Winner Stays Badge Text `auk.sea` 672,295 248x62 text "WINNER CAN STAY" | font "Baloo 2" 900 30px/45px ls normal color rgb(17, 17, 17)
    - Winner Stay Or Leave Choice `auk.lee` 110,684 860x112 | bg rgba(10, 15, 11, 0.88); border 3px solid rgb(255, 51, 64); radius 26px
      - Choice Countdown Ring `auk.sui` 133,701 78x78 | bg rgb(17, 17, 17); radius 3.35544e+07px
        - Choice Countdown Seconds `auk.zoa` 146,724 45x32 text "15s" | font "Baloo 2" 900 32px/32px ls normal color rgb(254, 209, 0)
      - Choice Prompt Stack `auk.aro` 227,713 415x53
        - Choice Prompt Line `auk.own` 227,713 415x28 text "@DAVE: type !stay to keep your seat" | font "Baloo 2" 900 25px/27.5px ls normal color rgb(255, 255, 255)
        - Choice Default Note `auk.dib` 227,741 244x25 text "No reply in 15s = seat opens" | font "Baloo 2" 700 20px/25px ls normal color rgb(255, 154, 160)
      - Stay Choice Pill `auk.has` 658,713 138x54 | bg rgb(254, 209, 0); border 3px solid rgb(17, 17, 17); radius 3.35544e+07px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(254, 209, 0, 0.7) 0px 0px 20px 0px, rgb(17, 17, 17) 0px 4px 0px 0px
        - Stay Choice Text `auk.cue` 679,726 62x28 text "STAY" | font "Baloo 2" 900 28px/28px ls normal color rgb(17, 17, 17)
        - SVG `auk.fit` 749,727 26x26
      - Leave Choice Pill `auk.bis` 812,713 158x54 | bg rgb(27, 28, 32); border 3px solid rgb(217, 220, 225); radius 3.35544e+07px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(17, 17, 17) 0px 4px 0px 0px
        - Leave Choice Text `auk.jan` 833,726 80x28 text "LEAVE" | font "Baloo 2" 900 28px/28px ls normal color rgb(255, 255, 255)
        - SVG `auk.sum` 921,726 28x28
  - Results Strip Skeleton `auk.dis` 100,810 880x366
    - Results Panel `auk.gob` 100,810 880x366 | bg rgba(10, 15, 11, 0.86); border 3px solid rgba(254, 209, 0, 0.6); radius 28px
      - Results Header `auk.gmt` 123,829 834x48
        - SVG `auk.ibm` 123,839 28x28
        - Results Title `auk.vhs` 163,829 126x48 text "RESULTS" | font "Baloo 2" 900 32px/48px ls normal color rgb(255, 255, 255)
        - Results Pieces Home Label `auk.hyp` 833,836 124x33 text "pieces home" | font "Baloo 2" 700 22px/33px ls normal color rgb(243, 231, 201)
      - Ocho Rios Result Row `auk.wun` 123,887 834x83 | bg rgb(7, 20, 12); border 3px solid rgb(25, 196, 90); radius 18px
        - Ocho Rios Rank `auk.bob` 140,907 60x42 text "2nd" | font "Baloo 2" 900 28px/42px ls normal color rgb(25, 196, 90)
        - Ocho Rios Result Piece `auk.gie` 214,908 40x40 | border 3px solid rgb(216, 255, 230); radius 3.35544e+07px; bgImage radial-gradient(circle at 38% 32%, rgb(124, 242, 164) 0%, rgb(15, 174, 71) 45%, rgb(0, 92, 34) 100%)
        - Ocho Rios Result Names `auk.til` 268,900 527x57
          - Ocho Rios Result Player `auk.hem` 268,900 97x32 text "@Mike" | font "Baloo 2" 900 30px/31.5px ls normal color rgb(255, 255, 255)
          - Ocho Rios Result Town `auk.bbc` 268,931 293x25 text "Ocho Rios · sitting out next game" | font "Baloo 2" 700 20px/25px ls normal color rgb(25, 196, 90)
        - Ocho Rios Home Count `auk.eat` 809,903 131x49 text "3 home" | font "Baloo 2" 900 30px/45px ls normal color rgb(17, 17, 17); bg rgb(25, 196, 90); radius 3.35544e+07px
      - Montego Bay Result Row `auk.sue` 123,979 834x83 | bg rgb(20, 17, 4); border 3px solid rgb(254, 209, 0); radius 18px
        - Montego Bay Rank `auk.sia` 140,999 60x42 text "3rd" | font "Baloo 2" 900 28px/42px ls normal color rgb(254, 209, 0)
        - Montego Bay Result Piece `auk.jay` 214,1000 40x40 | border 3px solid rgb(255, 248, 208); radius 3.35544e+07px; bgImage radial-gradient(circle at 38% 32%, rgb(255, 243, 160) 0%, rgb(254, 209, 0) 45%, rgb(168, 132, 0) 100%)
        - Montego Bay Result Names `auk.low` 268,992 527x57
          - Montego Bay Result Player `auk.out` 268,992 111x32 text "@Sarah" | font "Baloo 2" 900 30px/31.5px ls normal color rgb(255, 255, 255)
          - Montego Bay Result Town `auk.pst` 268,1024 321x25 text "Montego Bay · sitting out next game" | font "Baloo 2" 700 20px/25px ls normal color rgb(254, 209, 0)
        - Montego Bay Home Count `auk.dum` 809,996 131x49 text "2 home" | font "Baloo 2" 900 30px/45px ls normal color rgb(17, 17, 17); bg rgb(254, 209, 0); radius 3.35544e+07px
      - Negril Result Row `auk.cir` 123,1072 834x83 | bg rgb(17, 18, 20); border 3px solid rgb(217, 220, 225); radius 18px
        - Negril Rank `auk.her` 140,1092 60x42 text "4th" | font "Baloo 2" 900 28px/42px ls normal color rgb(217, 220, 225)
        - Negril Result Piece `auk.rap` 214,1093 40x40 | border 3px solid rgb(201, 205, 212); radius 3.35544e+07px; bgImage radial-gradient(circle at 38% 32%, rgb(122, 125, 132) 0%, rgb(38, 39, 43) 45%, rgb(5, 5, 6) 100%)
        - Negril Result Names `auk.was` 268,1085 531x57
          - Negril Result Player `auk.can` 268,1085 97x32 text "@John" | font "Baloo 2" 900 30px/31.5px ls normal color rgb(255, 255, 255)
          - Negril Result Town `auk.jar` 268,1116 258x25 text "Negril · sitting out next game" | font "Baloo 2" 700 20px/25px ls normal color rgb(217, 220, 225)
        - Negril Home Count `auk.isp` 813,1088 127x49 text "1 home" | font "Baloo 2" 900 30px/45px ls normal color rgb(17, 17, 17); bg rgb(217, 220, 225); radius 3.35544e+07px
  - Next Game Skeleton `auk.res` 100,1189 880x192
    - Next Game Cta Pill `auk.pep` 109,1182 862x138 | bg rgb(254, 209, 0); border 5px solid rgb(17, 17, 17); radius 34px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(254, 209, 0, 0.7) 0px 0px 40px 0px, rgb(17, 17, 17) 0px 8px 0px 0px
      - Next Game Cta Main Row `auk.toe` 160,1201 760x69
        - Next Game Seats Text `auk.lam` 160,1211 625x53 text "NEXT GAME: 3 SEATS OPEN · TYPE" | font "Baloo 2" 900 42px/42px ls normal color rgb(17, 17, 17)
        - Next Game Join Chip `auk.zan` 797,1201 123x58 text "!join" | font "Baloo 2" 900 44px/44px ls normal color rgb(254, 209, 0); bg rgb(17, 17, 17); radius 16px
      - Next Game Leave Variant Note `auk.did` 316,1262 450x35 text "4 seats open if @Dave leaves or doesn’t reply" | font "Baloo 2" 700 22px/27.5px ls normal color rgb(58, 44, 0)
    - Next Up And Credit Row `auk.ccd` 100,1325 880x56
      - Next Up Chip `auk.cad` 100,1325 328x56 | bg rgba(10, 15, 11, 0.86); border 2px solid rgb(25, 196, 90); radius 3.35544e+07px
        - SVG `auk.nov` 120,1341 24x24
        - Next Up Text `auk.but` 154,1335 254x36 text "Next up: @Tom, @Lucy" | font "Baloo 2" 900 24px/36px ls normal color rgb(255, 255, 255)
      - Game Credit Line `auk.reb` 643,1330 337x45 text "Game #24 · by StreamArchitect" | font "Baloo 2" 700 22px/33px ls normal color rgb(243, 231, 201); bg rgba(10, 15, 11, 0.7); radius 3.35544e+07px

## Raw Tailwind classes

Exact classes are in `code.jsx` (Wonder get_element_code output, unmodified).
