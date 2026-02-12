# Run RAFTS Frontend Docker Container

## Quick Start

```bash
docker run --rm -p 3080:8080 \
  --name rafts-frontend \
  bucket.canfar.net/rafts-frontend:latest
```

## Runtime Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_URL` | Public URL where the app is accessible | `https://rafts.canfar.net` |
| `NEXTAUTH_SECRET` | Session encryption key. Generate: `openssl rand -base64 32` | `VPDZsUHEBl...` |
| `NEXT_DOI_BASE_URL` | DOI backend API endpoint | `https://ws-cadc.canfar.net/doi/instances` |
| `NEXT_CANFAR_AC_LOGIN_URL` | CADC login endpoint | `https://ws-cadc.canfar.net/ac/login` |
| `NEXT_CANFAR_AC_SEARCH_URL` | CADC user search endpoint | `https://ws-cadc.canfar.net/ac/search` |
| `NEXT_CANFAR_AC_WHOAMI_URL` | CADC identity endpoint | `https://ws-cadc.canfar.net/ac/whoami` |
| `NEXT_CANFAR_AC_GROUPS_URL` | CADC groups endpoint | `https://ws-cadc.canfar.net/ac/groups` |
| `NEXT_CANFAR_RAFT_GROUP_NAME` | Reviewer group name in AC service | `RAFTS-reviewers` |
| `NEXT_CANFAR_STORAGE_BASE_URL` | Vault file storage URL | `https://ws-cadc.canfar.net/vault/files` |
| `NEXT_VAULT_BASE_ENDPOINT` | Vault files endpoint | `https://ws-cadc.canfar.net/vault/files` |
| `NEXT_CITE_URL` | Storage path prefix for RAFT data | `DOItest/rafts` |
| `NEXT_COOKIE_SSO_KEY` | SSO cookie key name | `CADC_SSO` |
| `NEXT_CANFAR_COOKIE_DOMAIN` | CANFAR cookie domain | `canfar.net` |
| `NEXT_CANFAR_COOKIE_URL` | CANFAR SSO cookie URL | `https://www.canfar.net/access/sso?cookieValue=` |
| `NEXT_CADC_COOKIE_DOMAIN` | CADC cookie domain | `cadc-ccda.hia-iha.nrc-cnrc.gc.ca` |
| `NEXT_CADC_COOKIE_URL` | CADC SSO cookie URL | `https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/access/sso?cookieValue=` |

### Internal Networking (set by Swarm stack, override for standalone)

| Variable | Description | Default in Swarm |
|----------|-------------|-----------------|
| `PORT` | Container listen port | `8080` |
| `NEXTAUTH_URL_INTERNAL` | Internal NextAuth callback URL | `http://rafts-frontend:8080` |
| `VALIDATOR_URL_XML` | ADES XML validation endpoint | `http://rafts-ades-validator:8080/validate-xml` |
| `VALIDATOR_URL_PSV` | ADES PSV validation endpoint | `http://rafts-ades-validator:8080/validate-psv` |
| `VALIDATOR_URL_MPC` | ADES MPC validation endpoint | `http://rafts-ades-validator:8080/validate-mpc` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXTAUTH_DEBUG` | Enable NextAuth debug logging | `false` |
| `UI_REVIEW_ENABLED` | Enable review workflow feature | `true` |
| `NODE_TLS_REJECT_UNAUTHORIZED` | Disable TLS verification (dev only!) | `1` |

## Run Examples

### Production (with Swarm network)

```bash
docker run --rm -p 8080:8080 \
  --network rafts-network \
  -e NEXTAUTH_URL=https://rafts.canfar.net \
  -e NEXTAUTH_SECRET=$(openssl rand -base64 32) \
  -e NEXT_DOI_BASE_URL=https://ws-cadc.canfar.net/doi/instances \
  -e NEXT_CANFAR_AC_LOGIN_URL=https://ws-cadc.canfar.net/ac/login \
  -e NEXT_CANFAR_AC_SEARCH_URL=https://ws-cadc.canfar.net/ac/search \
  -e NEXT_CANFAR_AC_WHOAMI_URL=https://ws-cadc.canfar.net/ac/whoami \
  -e NEXT_CANFAR_AC_GROUPS_URL=https://ws-cadc.canfar.net/ac/groups \
  -e NEXT_CANFAR_RAFT_GROUP_NAME=RAFTS-reviewers \
  -e NEXT_CANFAR_STORAGE_BASE_URL=https://ws-cadc.canfar.net/vault/files \
  -e NEXT_VAULT_BASE_ENDPOINT=https://ws-cadc.canfar.net/vault/files \
  -e NEXT_CITE_URL=DOItest/rafts \
  -e NEXT_COOKIE_SSO_KEY=CADC_SSO \
  -e NEXT_CANFAR_COOKIE_DOMAIN=canfar.net \
  -e NEXT_CANFAR_COOKIE_URL=https://www.canfar.net/access/sso?cookieValue= \
  -e NEXT_CADC_COOKIE_DOMAIN=cadc-ccda.hia-iha.nrc-cnrc.gc.ca \
  -e NEXT_CADC_COOKIE_URL=https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/access/sso?cookieValue= \
  -e VALIDATOR_URL_XML=http://ades-validator:8080/validate-xml \
  -e VALIDATOR_URL_PSV=http://ades-validator:8080/validate-psv \
  -e VALIDATOR_URL_MPC=http://ades-validator:8080/validate-mpc \
  --name rafts-frontend \
  bucket.canfar.net/rafts-frontend:latest
```

### Local Development (with env file)

```bash
docker run --rm -p 3080:8080 \
  --env-file ./frontend/.env.local \
  -e PORT=8080 \
  -e NODE_ENV=production \
  -e NEXTAUTH_SECRET=your-secret-here \
  -e VALIDATOR_URL_XML=http://host.docker.internal:8085/validate-xml \
  -e VALIDATOR_URL_PSV=http://host.docker.internal:8085/validate-psv \
  -e VALIDATOR_URL_MPC=http://host.docker.internal:8085/validate-mpc \
  -e NEXT_DOI_BASE_URL=http://host.docker.internal:8083/rafts/instances \
  --name rafts-frontend \
  rafts-frontend:local
```

**Note**: Use `host.docker.internal` to reach services running on the host machine from inside the container.

## Health Check

```bash
curl http://localhost:3080/api/health
```
