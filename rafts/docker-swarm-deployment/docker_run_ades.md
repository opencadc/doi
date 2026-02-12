# Run ADES Validator Docker Container

## Quick Start

```bash
docker run --rm -p 8080:8080 \
  --name ades-validator \
  bucket.canfar.net/ades-validator-api:latest
```

## Runtime Environment Variables

The ADES validator requires no environment variables. All configuration is built into the image.

| Variable | Description | Default | Notes |
|----------|-------------|---------|-------|
| (none) | No runtime configuration needed | — | Service is stateless |

## Run Examples

### Production (with Swarm network)

```bash
docker run --rm \
  --network rafts-network \
  --name ades-validator \
  bucket.canfar.net/ades-validator-api:latest
```

No port publishing needed in production — the frontend reaches the validator via the Docker network on port `8080`.

### Local Development (standalone)

```bash
docker run --rm -p 8085:8080 \
  --name ades-validator \
  ades-validator:local
```

### Local Development (shared network with frontend)

```bash
# Create network
docker network create rafts-network

# Run validator
docker run --rm -p 8085:8080 \
  --network rafts-network \
  --name ades-validator \
  ades-validator:local
```

The frontend can then reach the validator at `http://ades-validator:8080` via the shared network.

## Health Check

```bash
curl http://localhost:8085/health-check
```

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health-check` | GET | Health check |
| `/validate-xml` | POST | Validate ADES XML format |
| `/validate-psv` | POST | Validate ADES PSV format |
| `/validate-mpc` | POST | Validate ADES MPC format |
