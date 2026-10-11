# @ludi/live-connector

TikTok chat adapter and latency harness for Ludi Live build step 1.

The game server never talks to TikTok. This package turns chat into normalized commands. Dean runs the harness while live, types `!join` on his phone, and watches the command land on a local page with its lag.

## Licence pin

`tiktok-live-connector` 2.4.1 and later are AGPL-3.0-only. This package pins **exactly `tiktok-live-connector@2.4.0`**, the last MIT release.

Do not bump that dependency. 2.4.1+ cannot ship inside StreamArchitect's paid product.

All calls into that library live in `src/tiktokWorker.ts`. A later swap to TikFinity, a newer MIT fork, or another source is a one-file change. The parent process never imports the library, so a library crash does not take down the harness.

## Commands

From the monorepo root:

```bash
pnpm -s ludi -- live tiktok-watch --user <tiktokUsername> --json
```

Open the printed page (`http://127.0.0.1:8787` by default). Type `!join` in TikTok chat. The page lists the command and rolling p50/p95. PASS is p95 under 2000ms.

Offline:

```bash
pnpm -s ludi -- live tiktok-watch --replay packages/live-connector/testdata/pass.jsonl --json
```

That replay prints `PASS p95=100ms threshold=2000ms samples=4` and exits 0.

## Env

No secrets belong in this repo. `.env` is gitignored at the monorepo root.

If the library asks for a sign key or session, set them in your shell or a local `.env` you do not commit:

- `TIKTOK_SIGN_API_KEY` or `EULER_API_KEY`
- `TIKTOK_SESSION_COOKIE`
- `TIKTOK_SESSION_IDC` (optional `tt-target-idc`)

Euler Stream now asks for a Business-plan key before it will sign the chat socket. Without `TIKTOK_SIGN_API_KEY` the harness stops and says to set that key. It does not call that a "user is not live" failure.

If the user is not live, the harness exits with `user is not live: start a TikTok LIVE then rerun`.

## Prefixes

Default chat prefixes are `!join`, `!roll`, and `!move N` with N in 1-4. Override with `--join-prefix`, `--roll-prefix`, and `--move-prefix`.
