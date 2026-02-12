# RAFTS Environment Variables Guide for Docker Swarm Deployment

## Overview

RAFTS frontend is a Next.js application with three categories of environment variables:
- **Build-time**: Baked into the JS bundle during `docker build`
- **Runtime**: Injected at container start via Swarm stack environment
- **Internal networking**: Pre-configured in the stack for service-to-service communication

---

## A) Build-Time Variables

These MUST be set during `docker build` — they get inlined into the client-side JS bundle.

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NEXT_PUBLIC_BASE_PATH` | Subpath prefix (empty for root domain) | `` | `/rafts` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile bot protection key | `` | `0x4AAAA...` |

### How to set

```bash
docker build \
  --build-arg NEXT_PUBLIC_BASE_PATH=/rafts \
  --build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-key \
  -t bucket.canfar.net/rafts-frontend:latest \
  ./frontend
```

**IMPORTANT**: Changing `NEXT_PUBLIC_BASE_PATH` requires a full image rebuild.

---

## B) Runtime Variables

Set these in the Swarm stack environment or via shell exports before `docker stack deploy`.

### Authentication & Session

| Variable | Required | Description | Production Value |
|----------|----------|-------------|-----------------|
| `NEXTAUTH_URL` | YES | Public URL of the application | `https://rafts.canfar.net` |
| `NEXTAUTH_SECRET` | YES | Session encryption key (generate with `openssl rand -base64 32`) | *unique per environment* |
| `NEXTAUTH_DEBUG` | no | Enable debug logging | `false` |

### DOI Service

| Variable | Required | Description | Production Value |
|----------|----------|-------------|-----------------|
| `NEXT_DOI_BASE_URL` | YES | DOI backend endpoint | `https://ws-cadc.canfar.net/doi/instances` |

### CADC Access Control (AC) Service

| Variable | Required | Description | Production Value |
|----------|----------|-------------|-----------------|
| `NEXT_CANFAR_AC_LOGIN_URL` | YES | CADC login endpoint | `https://ws-cadc.canfar.net/ac/login` |
| `NEXT_CANFAR_AC_SEARCH_URL` | YES | CADC user search endpoint | `https://ws-cadc.canfar.net/ac/search` |
| `NEXT_CANFAR_AC_WHOAMI_URL` | YES | CADC identity endpoint | `https://ws-cadc.canfar.net/ac/whoami` |
| `NEXT_CANFAR_AC_GROUPS_URL` | YES | CADC groups endpoint | `https://ws-cadc.canfar.net/ac/groups` |
| `NEXT_CANFAR_RAFT_GROUP_NAME` | YES | Reviewer group name in AC | `RAFTS-reviewers` |

### Storage (CANFAR Vault/VOSpace)

| Variable | Required | Description | Production Value |
|----------|----------|-------------|-----------------|
| `NEXT_CANFAR_STORAGE_BASE_URL` | YES | Vault file storage URL | `https://ws-cadc.canfar.net/vault/files` |
| `NEXT_VAULT_BASE_ENDPOINT` | YES | Vault files endpoint | `https://ws-cadc.canfar.net/vault/files` |
| `NEXT_CITE_URL` | YES | Storage path prefix for RAFT data | `AstroDataCitationDOI/CISTI.CANFAR` |

### SSO Cookie Configuration

| Variable | Required | Description | Production Value |
|----------|----------|-------------|-----------------|
| `NEXT_COOKIE_SSO_KEY` | YES | SSO cookie key name | `CADC_SSO` |
| `NEXT_CANFAR_COOKIE_DOMAIN` | YES | CANFAR cookie domain | `canfar.net` |
| `NEXT_CANFAR_COOKIE_URL` | YES | CANFAR SSO cookie URL | `https://www.canfar.net/access/sso?cookieValue=` |
| `NEXT_CADC_COOKIE_DOMAIN` | YES | CADC cookie domain | `cadc-ccda.hia-iha.nrc-cnrc.gc.ca` |
| `NEXT_CADC_COOKIE_URL` | YES | CADC SSO cookie URL | `https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/access/sso?cookieValue=` |

### Application Settings

| Variable | Required | Description | Production Value |
|----------|----------|-------------|-----------------|
| `UI_REVIEW_ENABLED` | no | Enable review workflow feature | `true` |

---

## C) Internal Networking Variables (pre-configured in stack)

These are already set in `rafts-stack.yml` and should NOT be changed unless service names change.

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Fixed |
| `PORT` | `8080` | HAProxy expects 8080 |
| `NEXTAUTH_URL_INTERNAL` | `http://rafts-frontend:8080` | Internal NextAuth callback URL |
| `VALIDATOR_URL_XML` | `http://rafts-ades-validator:8080/validate-xml` | ADES XML validation |
| `VALIDATOR_URL_PSV` | `http://rafts-ades-validator:8080/validate-psv` | ADES PSV validation |
| `VALIDATOR_URL_MPC` | `http://rafts-ades-validator:8080/validate-mpc` | ADES MPC validation |

---

## Deployment

### Build images

```bash
# Frontend
docker build -t bucket.canfar.net/rafts-frontend:latest ./frontend

# Validator
docker build -t bucket.canfar.net/ades-validator-api:latest ./api/validator
```

### Deploy to Swarm

Option 1 - Export variables then deploy:

```bash
export NEXTAUTH_URL=https://rafts.canfar.net
export NEXTAUTH_SECRET=$(openssl rand -base64 32)
export NEXT_DOI_BASE_URL=https://ws-cadc.canfar.net/doi/instances
# ... set all required variables from section B above

docker stack deploy -c rafts-stack.yml rafts
```

Option 2 - Use an env file with the deploy script:

```bash
# Create .env with all variables from section B
# Then use the deploy script
./deploy.sh deploy
```

### Image override variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RAFTS_FRONTEND_IMAGE` | Frontend Docker image | `bucket.canfar.net/rafts-frontend:latest` |
| `ADES_VALIDATOR_IMAGE` | Validator Docker image | `bucket.canfar.net/ades-validator-api:latest` |

---

## Environment-Specific Values

### Production

```
NEXTAUTH_URL=https://rafts.canfar.net
NEXT_DOI_BASE_URL=https://ws-cadc.canfar.net/doi/instances
```

### RC (Release Candidate)

```
NEXTAUTH_URL=https://rc-rafts.canfar.net
NEXT_DOI_BASE_URL=https://rc-ws-cadc.canfar.net/rdoi/instances
```

### Local Development

```
NEXTAUTH_URL=http://localhost:3000
NEXT_DOI_BASE_URL=http://localhost:8080/rafts/instances
```
