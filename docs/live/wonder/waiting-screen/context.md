# Ludi Live TikTok Overlay - Waiting Screen

- Wonder dataNodeId: `are` (file 01a1280f-1b74-77f2-96d4-e2a6357d0791, page 01a1280f-1b76-78f9-a694-c24ae2ca8fa8)
- Status: Required
- Canvas: 1080 x 1920 px (artboard placed at canvas x=8140, y=0). Rendered root height: 1920 px.
- Positions below are in artboard px (top-left origin), measured by rendering `code.jsx` at 1080x1920 (DPR 1) in Chrome with Tailwind v4 + Baloo 2. The render was checked visually against `wonder-screenshot.png` (Wonder native capture).
- `screenshot.png` = 1080x1920 local render of code.jsx; `wonder-screenshot.png` = Wonder take_screenshot (max size Wonder returns). If they ever differ, Wonder is the source of truth.
- Tailwind note: Wonder classes `tracking-N` mean letter-spacing N*4px (e.g. tracking-1.5 = 6px) and `drop-shadow-[...]` are hard (0 blur) offset drop shadows; Tailwind v4 does not apply them out of the box, the render patched them.

## Fonts used (family, weight, size)

| Family | Weight | Size | Example |
|---|---|---|---|
| Baloo 2 | 900 | 132px | LUDI LIVE |
| Baloo 2 | 900 | 70px | !join |
| Baloo 2 | 900 | 64px | TYPE |
| Baloo 2 | 900 | 40px | ? |
| Baloo 2 | 900 | 34px | PLAYERS |
| Baloo 2 | 900 | 32px | 2/4 JOINED |
| Baloo 2 | 700 | 30px | by StreamArchitect |
| ui-sans-serif | 900 | 30px | · |
| Baloo 2 | 900 | 30px | @Dave |
| Baloo 2 | 900 | 28px | Open seat |
| Baloo 2 | 900 | 26px | Jamaican rules |
| Baloo 2 | 900 | 24px | @Dave |
| Baloo 2 | 700 | 24px | Game starts when 4 players join · next i |
| Baloo 2 | 700 | 22px | Last winner: |
| Baloo 2 | 900 | 18px | JOINED |

## Colours (hex literals in code, by frequency)

`#fed100` x32, `#111111` x16, `#f6efd9` x6, `#fed100cc` x6, `#d9dce1cc` x6, `#d9dce1` x6, `#f3e7c9` x4, `#009b3a` x4, `#fff6e3` x4, `#ff3340` x4, `#19c45a` x4, `#0000008c` x4, `#0b2a1a` x2, `#0a0f0bcc` x2, `#0a0f0bd1` x2, `#0b0b0c` x2, `#0a0f0bd6` x2, `#fed10099` x2, `#16090b` x2, `#ffe0e2` x2, `#e4202e` x2, `#07140c` x2, `#d8ffe6` x2, `#0fae47` x2

## Text strings (verbatim, in document order)

- "Last winner:"  (Last Winner Label, `are.had`)
- "@Dave"  (Last Winner Name, `are.gun`)
- "WINNER STAYS"  (Winner Stays Text, `are.now`)
- "LUDI LIVE"  (Ludi Live Wordmark, `are.who`)
- "by StreamArchitect"  (By StreamArchitect, `are.ing`)
- "·"  (Byline Dot, `are.day`)
- "Jamaican rules"  (Jamaican Rules Chip, `are.ers`)
- "TYPE"  (Join Cta Type Word, `are.may`)
- "!join"  (Join Cta Command Chip, `are.zen`)
- "TO PLAY"  (Join Cta To Play, `are.hau`)
- "PLAYERS"  (Seat Tracker Title, `are.pep`)
- "2/4 JOINED"  (Joined Count Chip, `are.mir`)
- "KINGSTON"  (Kingston Seat Town, `are.qua`)
- "@Dave"  (Kingston Seat Player Name, `are.did`)
- "JOINED"  (Kingston Joined Text, `are.eva`)
- "OCHO RIOS"  (Ocho Rios Seat Town, `are.lin`)
- "@Mike"  (Ocho Rios Seat Player Name, `are.mix`)
- "JOINED"  (Ocho Rios Joined Text, `are.cha`)
- "MONTEGO BAY"  (Montego Bay Seat Town, `are.alb`)
- "?"  (Montego Bay Question Mark, `are.elf`)
- "Open seat"  (Montego Bay Open Seat Text, `are.yoy`)
- "!join"  (Montego Bay Join Hint, `are.baa`)
- "NEGRIL"  (Negril Seat Town, `are.zan`)
- "?"  (Negril Question Mark, `are.hap`)
- "Open seat"  (Negril Open Seat Text, `are.cap`)
- "!join"  (Negril Join Hint, `are.ave`)
- "Game starts when 4 players join · next in line plays the winner"  (Game Start Note, `are.ail`)

## Layout and styles per element

Indented by nesting depth. Format: label `id` x,y wxh | styles.

- Ludi Live TikTok Overlay - Waiting Screen `are` 0,0 1080x1920 | bg rgb(11, 42, 26)
  - Background Photo Layer - Swap For Jamaica Photo `are.hox` 0,0 1080x1920
    - Backdrop Photo - Dean Beach Sunset `are.ess` 0,0 1080x1920 | bgImage url("https://cdn.wonder.so/images/01a1280f-1b74-77f2-96d4-e2a6357d0791/6ce5af0a0c352c962402e1cfb6dc61b86eab816aa50a391599881ca2f64f6e9c.jpg")
    - Backdrop Light Tint `are.jun` 0,0 1080x1920 | bgImage linear-gradient(rgba(6, 10, 8, 0.38) 0%, rgba(6, 10, 8, 0.12) 24%, rgba(6, 10, 8, 0) 36%, rgba(6, 10, 8, 0.05) 44%, rgba(6, 10, 8, 0.3) 58%, rgba(6, 10, 8, 0.4) 72%, rgba(6, 10, 8, 0.2) 100%)
  - Top Chips Row Skeleton `are.emm` 100,56 880x62
    - Last Winner Chip `are.avg` 100,56 290x62 | bg rgba(10, 15, 11, 0.8); border 3px solid rgb(254, 209, 0); radius 3.35544e+07px
      - SVG `are.she` 121,74 26x26
      - Last Winner Label `are.had` 157,71 121x33 text "Last winner:" | font "Baloo 2" 700 22px/33px ls normal color rgb(243, 231, 201)
      - Last Winner Name `are.gun` 288,69 81x36 text "@Dave" | font "Baloo 2" 900 24px/36px ls normal color rgb(255, 255, 255)
    - Winner Stays Badge `are.non` 739,50 242x74 | bg rgb(254, 209, 0); border 3px solid rgb(17, 17, 17); radius 3.35544e+07px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(17, 17, 17) 0px 5px 0px 0px
      - SVG `are.zag` 763,70 25x25
      - Winner Stays Text `are.now` 797,66 161x44 text "WINNER STAYS" | font "Baloo 2" 900 24px/36px ls normal color rgb(17, 17, 17)
  - Title Card Skeleton `are.big` 100,140 880x270
    - Ludi Live Title Card `are.nip` 140,140 800x270 | bg rgba(10, 15, 11, 0.82); border 5px solid rgb(254, 209, 0); radius 36px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(254, 209, 0, 0.45) 0px 0px 50px 0px, rgb(122, 74, 18) 0px 10px 0px 0px
      - Title Logo Row `are.one` 197,171 687x125
        - SVG `are.you` 189,178 111x111
        - Ludi Live Wordmark `are.who` 311,171 573x125 text "LUDI LIVE" | font "Baloo 2" 900 132px/125.4px ls normal color rgb(254, 209, 0); filter drop-shadow(rgb(17, 17, 17) 0px 6px 0px)
      - Jamaica Flag Stripe `are.has` 260,306 560x14 | radius 3.35544e+07px
        - Flag Stripe Green `are.ady` 260,306 187x14 | bg rgb(0, 155, 58)
        - Flag Stripe Gold `are.pre` 447,306 187x14 | bg rgb(254, 209, 0)
        - Flag Stripe Black `are.app` 633,306 187x14 | bg rgb(11, 11, 12)
      - Title Byline Row `are.but` 285,330 509x47
        - By StreamArchitect `are.ing` 285,331 261x45 text "by StreamArchitect" | font "Baloo 2" 700 30px/45px ls normal color rgb(246, 239, 217)
        - Byline Dot `are.day` 562,331 9x45 text "·" | font ui-sans-serif 900 30px/45px ls normal color rgb(254, 209, 0)
        - Jamaican Rules Chip `are.ers` 587,330 208x47 text "Jamaican rules" | font "Baloo 2" 900 26px/39px ls normal color rgb(255, 255, 255); bg rgb(0, 155, 58); radius 3.35544e+07px
  - Sky Window Skeleton `are.obe` 100,432 880x330
    - Dice Peek Pair `are.baw` 822,678 148x78 | opacity 0.92
      - SVG `are.taj` 814,670 95x95 | filter drop-shadow(rgb(17, 17, 17) 0px 6px 0px)
      - SVG `are.lek` 900,686 78x78 | filter drop-shadow(rgb(17, 17, 17) 0px 5px 0px)
  - Join Cta Skeleton `are.wat` 100,784 880x142
    - Join Cta Pill `are.deg` 128,770 824x171 | bg rgb(254, 209, 0); border 6px solid rgb(17, 17, 17); radius 40px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(254, 209, 0, 0.75) 0px 0px 48px 0px, rgb(17, 17, 17) 0px 10px 0px 0px
      - Join Cta Type Word `are.may` 237,829 148x69 text "TYPE" | font "Baloo 2" 900 64px/64px ls normal color rgb(17, 17, 17)
      - Join Cta Command Chip `are.zen` 400,811 189x92 text "!join" | font "Baloo 2" 900 70px/70px ls normal color rgb(254, 209, 0); bg rgb(17, 17, 17); radius 22px
      - Join Cta To Play `are.hau` 605,813 238x72 text "TO PLAY" | font "Baloo 2" 900 64px/64px ls normal color rgb(17, 17, 17)
  - Seat Tracker Panel `are.cos` 100,948 880x405 | bg rgba(10, 15, 11, 0.84); border 3px solid rgba(254, 209, 0, 0.6); radius 30px
    - Seat Tracker Header `are.aal` 125,969 830x52
      - Seat Tracker Title Group `are.web` 125,970 179x51
        - SVG `are.jem` 125,979 32x32
        - Seat Tracker Title `are.pep` 169,970 135x51 text "PLAYERS" | font "Baloo 2" 900 34px/51px ls normal color rgb(255, 255, 255)
      - Joined Count Chip `are.mir` 756,969 199x52 text "2/4 JOINED" | font "Baloo 2" 900 32px/48px ls normal color rgb(17, 17, 17); bg rgb(254, 209, 0); radius 3.35544e+07px
    - Seat Cards Grid `are.eng` 125,1037 830x241
      - Kingston Seat Filled `are.sea` 125,1037 197x240 | bg rgb(22, 9, 11); border 4px solid rgb(255, 51, 64); radius 22px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(228, 32, 46, 0.75) 0px 0px 26px 0px
        - Kingston Seat Town `are.qua` 167,1057 113x36 text "KINGSTON" | font "Baloo 2" 900 24px/36px ls normal color rgb(255, 51, 64)
        - Kingston Piece Disc `are.dir` 192,1101 64x64 | border 4px solid rgb(255, 224, 226); radius 3.35544e+07px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(122, 7, 16) 0px 6px 0px 0px; bgImage radial-gradient(circle at 38% 32%, rgb(255, 154, 160) 0%, rgb(228, 32, 46) 45%, rgb(122, 7, 16) 100%)
        - Kingston Seat Player Name `are.did` 173,1173 101x45 text "@Dave" | font "Baloo 2" 900 30px/45px ls normal color rgb(255, 255, 255)
        - Kingston Joined Chip `are.ten` 171,1226 106x31 | bg rgb(228, 32, 46); radius 3.35544e+07px
          - SVG `are.our` 183,1234 16x16
          - Kingston Joined Text `are.eva` 205,1228 60x27 text "JOINED" | font "Baloo 2" 900 18px/27px ls normal color rgb(255, 255, 255)
      - Ocho Rios Seat Filled `are.col` 336,1037 197x240 | bg rgb(7, 20, 12); border 4px solid rgb(25, 196, 90); radius 22px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(15, 174, 71, 0.75) 0px 0px 26px 0px
        - Ocho Rios Seat Town `are.lin` 374,1057 120x36 text "OCHO RIOS" | font "Baloo 2" 900 24px/36px ls normal color rgb(25, 196, 90)
        - Ocho Rios Piece Disc `are.her` 403,1101 64x64 | border 4px solid rgb(216, 255, 230); radius 3.35544e+07px; shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(0, 92, 34) 0px 6px 0px 0px; bgImage radial-gradient(circle at 38% 32%, rgb(124, 242, 164) 0%, rgb(15, 174, 71) 45%, rgb(0, 92, 34) 100%)
        - Ocho Rios Seat Player Name `are.mix` 386,1173 97x45 text "@Mike" | font "Baloo 2" 900 30px/45px ls normal color rgb(255, 255, 255)
        - Ocho Rios Joined Chip `are.fed` 382,1226 106x31 | bg rgb(15, 174, 71); radius 3.35544e+07px
          - SVG `are.spy` 394,1234 16x16
          - Ocho Rios Joined Text `are.cha` 416,1228 60x27 text "JOINED" | font "Baloo 2" 900 18px/27px ls normal color rgb(255, 255, 255)
      - Montego Bay Seat Empty `are.eft` 547,1037 197x241 | bg rgba(0, 0, 0, 0.55); border 4px dashed rgba(254, 209, 0, 0.8); radius 22px
        - Montego Bay Seat Town `are.alb` 566,1057 159x36 text "MONTEGO BAY" | font "Baloo 2" 900 24px/36px ls normal color rgb(254, 209, 0)
        - Montego Bay Empty Slot `are.nim` 614,1101 64x64 | border 4px dashed rgba(254, 209, 0, 0.8); radius 3.35544e+07px
          - Montego Bay Question Mark `are.elf` 636,1113 20x40 text "?" | font "Baloo 2" 900 40px/40px ls normal color rgb(254, 209, 0)
        - Montego Bay Open Seat Text `are.yoy` 581,1173 129x42 text "Open seat" | font "Baloo 2" 900 28px/42px ls normal color rgb(246, 239, 217)
        - Montego Bay Join Hint `are.baa` 613,1223 65x35 text "!join" | font "Baloo 2" 900 18px/27px ls normal color rgb(254, 209, 0); border 2px solid rgba(254, 209, 0, 0.8); radius 3.35544e+07px
      - Negril Seat Empty `are.per` 758,1037 197x241 | bg rgba(0, 0, 0, 0.55); border 4px dashed rgba(217, 220, 225, 0.8); radius 22px
        - Negril Seat Town `are.zan` 817,1057 80x36 text "NEGRIL" | font "Baloo 2" 900 24px/36px ls normal color rgb(217, 220, 225)
        - Negril Empty Slot `are.lbs` 825,1101 64x64 | border 4px dashed rgba(217, 220, 225, 0.8); radius 3.35544e+07px
          - Negril Question Mark `are.hap` 847,1113 20x40 text "?" | font "Baloo 2" 900 40px/40px ls normal color rgb(217, 220, 225)
        - Negril Open Seat Text `are.cap` 792,1173 129x42 text "Open seat" | font "Baloo 2" 900 28px/42px ls normal color rgb(246, 239, 217)
        - Negril Join Hint `are.ave` 824,1223 65x35 text "!join" | font "Baloo 2" 900 18px/27px ls normal color rgb(217, 220, 225); border 2px solid rgba(217, 220, 225, 0.8); radius 3.35544e+07px
    - Game Start Note `are.ail` 125,1294 830x36 text "Game starts when 4 players join · next in line plays the winner" | font "Baloo 2" 700 24px/36px ls normal color rgb(243, 231, 201)

## Raw Tailwind classes

Exact classes are in `code.jsx` (Wonder get_element_code output, unmodified).
