# PTP Live AIS backend

Cloudflare Worker + SQLite Durable Object, receiving AISStream positions near PTP. Live AIS is supplemental situational awareness, **not** an official navigational/VTS feed.

## Deployment

1. Cloudflare Worker name: `ptp-live-ais`. Existing secret: `AISSTREAM_API_KEY` (never commit it).
2. In Cloudflare Worker **Settings → Builds**, connect GitHub `asyraf6857/weekly-report-dashboard`, branch `main`.
3. **Root directory:** `ais-backend` (if shown). Otherwise set **Deploy command** to `cd ais-backend && npx wrangler deploy`.
4. Build command: leave blank. Deploy command: `npx wrangler deploy` when root directory is `ais-backend`.
5. Check Cloudflare plan supports SQLite-backed Durable Objects and Cron Triggers; first deployment creates class via migration `v1`.
6. Confirm `https://ptp-live-ais.asyraf6857.workers.dev/health` and `/vessels`. First AIS connection may take up to a minute.
7. Frontend: configure `window.VTMS_AIS_RELAY_URL='https://ptp-live-ais.asyraf6857.workers.dev/vessels'` **before** the existing AIS overlay script.

The public endpoint exposes vessel locations; protect access if this is intended for internal-only use. Outbound WebSocket lifecycle and reconnect behavior should be tested in Cloudflare production before treating this as reliable continuous monitoring.
