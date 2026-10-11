# TikTok watch

Offline replay and live TikTok chat check for Ludi Live. The harness prints each matching command with its lag and a PASS/FAIL line. PASS is p95 under 2000ms.

## Sub-features

- `tiktok-watch-replay` plays `packages/live-connector/testdata/pass.jsonl` and prints PASS.
- `tiktok-watch-help` names `--user`, `--replay`, `--source`, and the "user is not live" hint.
- `tiktok-watch-tikfinity` is the default live path. Agents prove it against a fake local WebSocket. Dean's real-stream gate uses TikFinity Desktop.
- `tiktok-watch-live` is the opt-in `--source connector` path. Agents try a 60s public live only when TikTok is reachable.

## How to get to it (user POV)

- Dean: install TikFinity Desktop, sign in, connect it to TikTok, enable the local Event API if needed, go live, run `ludi live tiktok-watch --json`, open the printed local page, type `!join` in chat.
- Agent: replay the checked-in JSONL, or run the package TikFinity e2e against a fake `ws://127.0.0.1` server. Do not invent a live user when TikTok is blocked.

## Driving it with ludi

Preconditions:

- `pnpm install` completed at the monorepo root.

- **Help.** Run `pnpm -s ludi -- live tiktok-watch --help`. Exit `0`. Stdout names `--user`, `--replay`, `--source`, and `user is not live: start a TikTok LIVE then rerun`.
- **Replay PASS.** Run `pnpm -s ludi -- live tiktok-watch --replay packages/live-connector/testdata/pass.jsonl --page false --output json`. Exit `0`. Stdout contains `PASS p95=100ms threshold=2000ms samples=4`.
- **Replay FAIL.** Run `pnpm -s ludi -- live tiktok-watch --replay packages/live-connector/testdata/fail.jsonl --page false --output json`. Exit `5`. Stdout contains `FAIL p95=3760ms threshold=2000ms samples=3`.
- **TikFinity package e2e.** Run `pnpm --dir packages/live-connector test src/tikfinityWatch.e2e.test.ts`. Exit `0`. That starts a fake local WebSocket and expects `PASS p95=… threshold=2000ms samples=4`.
- **Live 60s connector (optional).** If `https://www.tiktok.com` is reachable, run `pnpm -s ludi -- live tiktok-watch --source connector --user <currently-live-public-account> --duration-s 60 --json`. Record p95. If TikTok is not reachable, say so. Dean's real-stream run uses TikFinity.

## Gotchas

- Default source is TikFinity (`--source tikfinity`). `--source connector` keeps `tiktok-live-connector` at MIT `2.4.0`. Do not bump it. 2.4.1+ is AGPL-3.0-only.
- Library calls live only in `packages/live-connector/src/tiktokWorker.ts`.
- TikFinity needs no secrets. Do not put sign keys or session cookies in the repo. `--source connector` still reads `TIKTOK_SIGN_API_KEY` / `EULER_API_KEY` / `TIKTOK_SESSION_COOKIE` from the environment.
- A missing Euler sign key is `PRECONDITION_FAILED` with the sign-key hint. It is not "user is not live".
- Existing `baselines/web/` shots are unchanged by this check.
