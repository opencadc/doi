# Build RAFTS Frontend Docker Image

## Build Command (with subpath /rafts)

```bash
docker build --build-arg NEXT_PUBLIC_BASE_PATH=/rafts -t bucket.canfar.net/rafts-frontend:latest ./frontend
```

## Build Arguments

| Argument | Required | Description | Default |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_BASE_PATH` | yes | Subpath prefix for deployment behind a reverse proxy. Set to `/rafts` for RC/production. | `/rafts` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | no | Cloudflare Turnstile site key for bot protection. | `` (empty) |

## Build with Subpath

If deploying at a subpath (e.g., `https://example.com/rafts`):

```bash
docker build \
  --build-arg NEXT_PUBLIC_BASE_PATH=/rafts \
  -t bucket.canfar.net/rafts-frontend:latest \
  ./frontend
```

**IMPORTANT**: `NEXT_PUBLIC_BASE_PATH` is baked into the Next.js bundle at build time. Changing it requires a full image rebuild.

## Build with Turnstile

```bash
docker build \
  --build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAA... \
  -t bucket.canfar.net/rafts-frontend:latest \
  ./frontend
```

## Build with All Arguments

```bash
docker build \
  --build-arg NEXT_PUBLIC_BASE_PATH=/rafts \
  --build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAA... \
  -t bucket.canfar.net/rafts-frontend:latest \
  ./frontend
```

## Notes

- Base image: `node:22-alpine`
- Exposes port `8080`
- Runs as non-root user `nextjs` (uid 1001)
- Uses `dumb-init` for proper signal handling
- Output mode: Next.js standalone (minimal production bundle)
