# @ludi/live-connector

TikTok chat adapters and the latency harness for Ludi Live.

The game server never talks to TikTok. This package turns chat into normalized commands. Dean runs the harness while live, types `!join` on his phone, and watches the command land on a local page with its lag.

## Default source: TikFinity

Dean chose TikFinity over the Euler Stream sign key. The default source is TikFinity Desktop's local Event API. No secrets.

Official pages:

- App and Event API note: [tikfinity.zerody.one/tiktok/dapi](https://tikfinity.zerody.one/tiktok/dapi)
- Setup: [blog.tikfinity.com/tikfinity-setup](https://blog.tikfinity.com/tikfinity-setup/)

The public dapi page says the desktop app must run on the same computer. It does not publish the port or JSON schema. Third-party clients and a recorded chat dump agree on `ws://127.0.0.1:21213/` and `{ "event": "chat", "data": { "comment", "userId", "uniqueId", "nickname", "createTime" } }`. See [TikFinity-Public-Docs#1](https://github.com/zerodytrash/TikFinity-Public-Docs/issues/1) and [placar-live/overlay.js](https://github.com/TrveLeo/placar-live/blob/main/overlay.js). Gift fields are inferred from that overlay, not from an official dump. The parser also accepts nested `user` / `giftDetails` aliases and ignores unknown events.

The Event API is a Windows desktop-app feature. The browser and Mac apps do not expose it. Third parties say to enable the local Event API / WebSocket in TikFinity settings. Official docs confirm the Event API needs the desktop app and do not name the toggle.

## Licence pin

`tiktok-live-connector` 2.4.1 and later are AGPL-3.0-only. This package pins **exactly `tiktok-live-connector@2.4.0`**, the last MIT release.

Do not bump that dependency. 2.4.1+ cannot ship inside StreamArchitect's paid product.

All calls into that library live in `src/tiktokWorker.ts`. `--source connector` keeps that adapter. The parent process never imports the library.

## Commands

From the monorepo root.

TikFinity, the default:

```bash
pnpm -s ludi -- live tiktok-watch --json
```

Connector, opt-in:

```bash
pnpm -s ludi -- live tiktok-watch --source connector --user <tiktokUsername> --json
```

Open the printed page (`http://127.0.0.1:8787` by default). Type `!join` in TikTok chat. The page lists the command and rolling p50/p95. PASS is p95 under 2000ms.

When TikFinity omits `createTime`, the harness reports receive-time spread and labels it `local receive lag`. That is not end-to-end delay.

Override the local socket if your Event API is not on the default port:

```bash
pnpm -s ludi -- live tiktok-watch --url ws://127.0.0.1:21213/ --json
```

`ludi` treats `--url` as a global flag. A `ws://` or `wss://` value is the TikFinity socket. An `http://` value is ignored for this command.

Offline:

```bash
pnpm -s ludi -- live tiktok-watch --replay packages/live-connector/testdata/pass.jsonl --json
```

That replay prints `PASS p95=100ms threshold=2000ms samples=4` and exits 0.

## Dean's live test with TikFinity

1. Install TikFinity Desktop from [tikfinity.zerody.one](https://tikfinity.zerody.one/) and open it. The Event API is Windows-only.
2. Sign in. Under Setup, enter your TikTok @handle and connect TikFinity to your account.
3. Enable the local Event API / WebSocket if that setting exists. The usual socket is `ws://127.0.0.1:21213/`.
4. Go LIVE on TikTok. Wait until TikFinity shows it is attached to the LIVE.
5. From the monorepo root run:

```bash
pnpm -s ludi -- live tiktok-watch --json
```

6. Open the printed local page. On your phone, type `!join` in the LIVE chat.
7. PASS looks like `PASS p95=123ms threshold=2000ms samples=1` with p95 under 2000ms. If `createTime` is missing, the line ends with `(local receive lag)`.

If the harness says `TikFinity not running`, open the desktop app, sign in, enable the Event API, start the LIVE, then rerun. If it says `TikFinity running but not connected to a LIVE`, start the LIVE and wait until TikFinity attaches, then type `!join`.

## Env

No secrets belong in this repo. `.env` is gitignored at the monorepo root.

TikFinity needs none. `--source connector` still reads these if the library asks:

- `TIKTOK_SIGN_API_KEY` or `EULER_API_KEY`
- `TIKTOK_SESSION_COOKIE`
- `TIKTOK_SESSION_IDC` (optional `tt-target-idc`)

If the user is not live on the connector path, the harness exits with `user is not live: start a TikTok LIVE then rerun`.

## Prefixes

Default chat prefixes are `!join`, `!roll`, `!move N` with N in 1-4, `!stay`, and `!leave`. Override with `--join-prefix`, `--roll-prefix`, `--move-prefix`, `--stay-prefix`, and `--leave-prefix`.

Gifts are cosmetic only. They never become commands and they never change the PASS line.
