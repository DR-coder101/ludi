# TikTok watch

Offline replay and live TikTok chat check for Ludi Live. The harness prints each matching command with its lag and a PASS/FAIL line. PASS is p95 under 2000ms.

## Sub-features

- `tiktok-watch-replay` plays `packages/live-connector/testdata/pass.jsonl` and prints PASS.
- `tiktok-watch-help` names `--user`, `--replay`, and the "user is not live" hint.
- `tiktok-watch-live` is Dean's real-stream gate. Agents try a 60s public live only when TikTok is reachable.

## How to get to it (user POV)

- Dean: go live on TikTok, run `ludi live tiktok-watch --user <name> --json`, open the printed local page, type `!join` in chat.
- Agent: replay the checked-in JSONL. Do not invent a live user when TikTok is blocked.

## Driving it with ludi

Preconditions:

- `pnpm install` completed at the monorepo root.

- **Help.** Run `pnpm -s ludi -- live tiktok-watch --help`. Exit `0`. Stdout names `--user`, `--replay`, and `user is not live: start a TikTok LIVE then rerun`.
- **Replay PASS.** Run `pnpm -s ludi -- live tiktok-watch --replay packages/live-connector/testdata/pass.jsonl --page false --output json`. Exit `0`. Stdout contains `PASS p95=100ms threshold=2000ms samples=4`.
- **Replay FAIL.** Run `pnpm -s ludi -- live tiktok-watch --replay packages/live-connector/testdata/fail.jsonl --page false --output json`. Exit `5`. Stdout contains `FAIL p95=3760ms threshold=2000ms samples=3`.
- **Live 60s (optional).** If `https://www.tiktok.com` is reachable, run `pnpm -s ludi -- live tiktok-watch --user <currently-live-public-account> --duration-s 60 --json`. Record p95. If TikTok is not reachable, say so. Dean's real-stream run is the gate.

## Gotchas

- `tiktok-live-connector` is pinned at MIT `2.4.0`. Do not bump it. 2.4.1+ is AGPL-3.0-only.
- Library calls live only in `packages/live-connector/src/tiktokWorker.ts`.
- Do not put sign keys or session cookies in the repo. Read `TIKTOK_SIGN_API_KEY` / `EULER_API_KEY` / `TIKTOK_SESSION_COOKIE` from the environment.
- A missing Euler sign key is `PRECONDITION_FAILED` with the sign-key hint. It is not "user is not live".
- Existing `baselines/web/` shots are unchanged by this check.
