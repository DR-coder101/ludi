# How to swap Ludi theme music

Ludi plays one theme file. Replace that file to change the song. Do not add a second music file.

## Replace the song

Overwrite `apps/mobile/assets/audio/theme.mp3`.

Keep the file name. The app requires that path from `apps/mobile/src/audio/music.ts`. No other source file should require a theme asset.

The checked-in file is a 2:02 demo, Dancehall Build-Up Riddim by Ryan. Rights are still being confirmed. Treat it as a demo until Dean replaces it.

Encode replacements at about 128 kbps AAC or MP3, mono or stereo. Drop album art if the file is large.

## What the file drives

`music.ts` is the only music config.

- Lobby loop. The whole track, looped, volume 0.35, fade in and out 600 ms. Plays on non-match screens. Stops on `/game`, `/game/:code`, and `/dev/board` so it does not fight voice chat. Pauses when the app backgrounds. Respects `gameAudio.setEnabled(false)`.
- Win sting. A 3 second cut from the same file. `play('win')` on the existing victory moment plays it.

## Adjust the win sting

Edit `themeClips.sting` in `apps/mobile/src/audio/music.ts`.

- `startMs` is the cut start.
- `endMs` is the cut end. Keep `endMs - startMs` at 3000 unless the new sting should be a different length.
- Leave `source` as `themeSource`.

The demo sting is 105000 to 108000 (1:45 to 1:48). Change those numbers when the new song's hit sits somewhere else.

## Mute

`gameAudio.setEnabled(false)` stops the lobby loop and skips the sting and SFX. There is no separate music mute.
