# TikTok LIVE specs for the Ludi Live overlay (researched 11 Oct 2026)

## Canvas / resolution (OFFICIAL)
- LIVE Studio quality tiers: 1080p (1920x1080), 720p (1280x720, "recommended for most scenarios" because viewers are on phones), 480p. FPS: 30 recommended for most content, 45/60 for gaming. Bitrate: use LIVE Studio's default / Test speed, no fixed number published.
  - https://www.tiktok.com/live/studio/help/article/Enhance-visuals/Adjust-LIVE-quality-for-smooth-and-clear-video?lang=en
  - https://www.tiktok.com/live/creators/en-US/article/configure-live-settings-in-live-studio-en-US (FPS above 60 unnecessary; at least 30 for gaming)
- No official page found giving a vertical canvas spec or bitrate for OBS/RTMP.
## Canvas / resolution (THIRD-PARTY)
- OBS for TikTok: 1080x1920 canvas and output, 30 fps, 2-s keyframes, 2,500-4,000 kbps (obs-versions.com) or 4,500-6,000 kbps at 1080p30 (streamhouse.co).
  - https://obs-versions.com/blog/obs-tiktok-live-streaming-guide
  - https://streamhouse.co/blog/tiktok-live-vertical-settings
- RTMP stream keys are only given to some accounts, and TikTok doesn't publish the criteria. The common route is OBS Virtual Camera into LIVE Studio (Castream, TIKTORY, umatechnology).
  - https://help.castream.io/en/help/troubleshooting/cant-find-tiktok-rtmp-stream-key
  - https://help.tiktory.com/en/pages/how-to-setup-obs-virtual-camera-with-tiktok-live-studio

## Safe zones
- OFFICIAL LIVE safe zone in pixels: NOT FOUND. TikTok publishes no LIVE overlay safe-zone template.
- PROXY (ads, not LIVE): TikTok In-Feed ad safe-zone template, as measured by third parties on 1080x1920: top 240, bottom 660, left/right 120, plus the right action rail from x 780 down from y 840. TikTok itself publishes only overlay files, no numbers.
  - https://www.toolswebpro.com/tools/tiktok-safe-zone-checker ; https://adkit.so/tools/safe-zones/tiktok ; https://www.adsights.ai/resources/tools/generators/ad-safe-zone-checker ; https://recruitmentads.com/free-tools/ad-mockup/tiktok
- THIRD-PARTY LIVE guidance: keep critical text between y 250 and 1300, keep 120-150 px clear on the right and 400 px clear at the bottom (tikvaults.com). ttwise.live says to test on a phone because the UI shifts between devices.
- MY MEASUREMENT of TikTok's official Multi-guest one-pager mock-up (Panel 1+3, phone screen scaled to 1080x1920, approximate):
  - Top UI (host name, viewer avatars, tags, gift banner): to about y 270 on the left and about y 420 on the right.
  - Comments: start about y 1460 on the left. Bottom buttons: about y 1720-1900.

## Multi-guest (OFFICIAL)
- Host can have up to 9 guests (2023 creator article). The older 2022 one-pager says up to 3. Layouts are Panel and Grid, plus an optional "Fixed" setting, and can be changed before or during LIVE.
  - https://www.tiktok.com/live/creators/en-US/article/Multi-guest_Introduction_en-US
  - https://www.tiktok.com/live/creators/en-SA/article/go-live-together-via-multi-guest_en-SA
  - https://sf16.tiktokcdn-us.com/obj/eden-va2/lfpzbf/live_creator_hub/TikTok-LIVE-Multi-guest-One-pager_April-2022.pdf
- Official one-pager mock-ups:
  - Panel: host video stays full screen, and guest tiles are drawn by the TikTok app on top of it, stacked bottom-up on the right.
  - Grid: the screen is split into equal tiles, and the host's own video, including any overlay, becomes one cropped tile.
- Guests join from the TikTok phone app. Their video is not in the host's OBS/LIVE Studio canvas.
## Multi-guest (THIRD-PARTY)
- Multi-guest works from LIVE Studio on PC/Mac: Tools > Multi-guest, up to 8 guests, Panel/Grid layout, and overlays and browser sources still work (toktutorials.com).
  - https://www.toktutorials.com/post/how-to-use-co-host-battles-and-multi-guest-in-tiktok-live-studio-pc-mac
- Whether multi-guest works on a pure OBS RTMP (stream key) LIVE: no source found either way.

## Measured guest-tile zone (Panel 1+3, from the official mock-up, APPROXIMATE)
- Tile column: x about 713-1058 (about 345 px wide, about 32% of the width). Each tile is about 345x375, with a gap of about 12 px.
- Stack: y about 576-1718, from 30% to 89.5% of the height. The newest guest is at the bottom.
- Layouts for 4 or more guests are not shown in any official source. This is a 2022 mock-up, so verify on a real stream.

## Can an overlay frame the guests?
- Not reliably.
  - In Panel, TikTok draws the tiles over the host video in the viewer's app. An overlay can only leave that area blank, and alignment depends on the device and app version.
  - In Grid, the whole overlay is shrunk into one tile, so a full-screen game overlay doesn't work.
- Use Panel and keep the right column clear.

## Real multi-guest panel (Dean's screenshot, 11 Oct 2026)
MEASURED FROM ONE SCREENSHOT (dean_multiguest_screenshot.png): a phone at 1080x2400, a viewer's view, Panel layout with 5 guests plus a "Request" tile. Other phones, app versions and guest counts may differ.
- Host video box (screen px): left 0, top 531, right 733, bottom 2092. That's 734 x 1561 px.
  - As fractions of the screen: x 0.000-0.679, y 0.221-0.872.
  - Aspect ratio 0.470 (about 9:19.1), which is narrower than 9:16 (0.5625).
- The "Host" tag sits just above the box at about y 470-500. The box has no top UI over it.
- Guest column (screen px): x 790-1061, y 446-2189, which is x 0.731-0.982 and y 0.186-0.912. Six slots are stacked about 248 px apart. There's a 57 px gap between the host box and the guest column.
- Comments over the host box: the first (pinned/host) bubble starts at about y 1664, which is 0.693 of the screen and 0.726 down the host box. Comment bubbles span about x 30-760, which is nearly the whole box width. The comment input bar is below the box at about y 2190-2290.
- How a 9:16 stream is fitted: scaled to the box height and cropped on the sides (cover fit), not letterboxed.
  - Evidence: the host's centred title text and caption lines are cut off on both the left and the right edge, and there are no black bars.
  - Scale = 1561/1920 = 0.813, so the canvas becomes 878 x 1561 and about 72 screen px are cut from each side. A centred crop is assumed.
- Visible part of a 1080x1920 canvas in panel mode: x about 88-991 (about 903 px wide), full height y 0-1920.
  - Comments cover canvas y > about 1389 (that's (1664-531)/0.813), across almost the full width.
  - Safe area to design to, with a margin: x 100-980, y 40-1380.
- In solo (no-guest) mode the full canvas is shown with TikTok's normal top and right UI on top. See the proxy safe zones above.
