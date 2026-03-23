# PumpRadar Deploy Notes

Target host for temporary public testing:

- `https://pump.arbitrajz.com`

Current assumptions from the server state you provided:

- app root: `/srv/data/arbitrajz`
- backup: `/srv/data/arbitrajz-old-backup-2026-03-18`
- backend listens on `127.0.0.1:8010`
- frontend static build lives in `/srv/data/arbitrajz/frontend/build`
- existing `arb.arbitrajz.com` setup must remain untouched

## Caddy

Use [Caddyfile.pump-arbitrajz.com](/home/gicamitica/pump_radar/deploy/Caddyfile.pump-arbitrajz.com) as the site block for `pump.arbitrajz.com`.

Behavior:

- serves static frontend from `/srv/data/arbitrajz/frontend/build`
- proxies `/api/*` to `127.0.0.1:8010`
- rewrites all non-file, non-API routes to `/index.html` for SPA routing

## Cloudflare

Recommended for temporary exposure:

1. Create DNS or tunnel route for `pump.arbitrajz.com`
2. Point it to the machine running Caddy
3. Keep `arbitrajz.com` and `arb.arbitrajz.com` unchanged

If using a tunnel, see:

- [cloudflared-pump-arbitrajz.example.yml](/home/gicamitica/pump_radar/deploy/cloudflared-pump-arbitrajz.example.yml)

## Verification

Public checks after routing is live:

1. `https://pump.arbitrajz.com`
2. `https://pump.arbitrajz.com/auth/register`
3. `https://pump.arbitrajz.com/auth/login`
4. `https://pump.arbitrajz.com/dashboard`
5. `https://pump.arbitrajz.com/super-admin`

API smoke tests:

```bash
curl -I https://pump.arbitrajz.com
curl -I https://pump.arbitrajz.com/api/auth/me
```

Expected:

- frontend loads from Caddy
- `/api/*` reaches backend on `127.0.0.1:8010`
- SPA routes return `index.html`
