# RAFTS - Research Announcement for Transient Sources

A web application for managing astronomical transient observation submissions (RAFTs) with ADES file validation.

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Git

### 1. Clone and Configure

```bash
# Clone the repository
git clone <repository-url> rafts
cd rafts

# Copy environment template
cp .env.example .env

# Edit configuration (at minimum, set NEXTAUTH_SECRET)
# Generate a secret: openssl rand -base64 32
nano .env
```

### 2. Deploy

```bash
# Development (with hot reload)
./deploy.sh dev

# Production
./deploy.sh prod

# Check status
./deploy.sh health
```

### 3. Access

| Environment | Frontend URL | Validator API |
|-------------|--------------|---------------|
| Development | http://localhost:3000 | http://localhost:8000 |
| Production | http://localhost (via nginx) | Internal only |

---

## Project Structure

```
rafts/
├── frontend/              # Next.js application
│   ├── Dockerfile         # Production build
│   ├── Dockerfile.dev     # Development with hot reload
│   ├── src/               # Application source code
│   └── ...
├── api/
│   └── validator/         # ADES validation API (FastAPI)
│       ├── Dockerfile     # Production build
│       ├── app/           # FastAPI application
│       └── ades/          # ADES validation library
├── nginx/                 # Nginx configuration (production)
├── docker-compose.yml     # Unified deployment
├── deploy.sh              # Deployment script
├── .env.example           # Environment template
└── README.md              # This file
```

---

## Deployment Commands

```bash
# Start development environment
./deploy.sh dev

# Start production environment
./deploy.sh prod

# View logs
./deploy.sh logs                    # All services
./deploy.sh logs rafts-frontend     # Frontend only

# Check health
./deploy.sh health

# Stop all services
./deploy.sh stop

# Clean up (remove containers and images)
./deploy.sh clean
```

---

## Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_URL` | Public URL of the application | `https://rafts.example.com` |
| `NEXTAUTH_SECRET` | Session encryption secret | `openssl rand -base64 32` |
| `NEXT_DOI_BASE_URL` | DOI service endpoint | `https://ws-cadc.canfar.net/doi/instances` |
| `NEXT_CANFAR_RAFT_GROUP_NAME` | Reviewer group name | `RAFTS-reviewers` |

### Optional Configuration

See `.env.example` for complete list of configuration options including:
- CADC Access Control settings
- Storage configuration
- SSO cookie settings
- SSL/TLS options

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                               │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx (Production)                        │
│                    Port 80/443                               │
└────────────────────────────┬────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│   rafts-frontend        │   │   ades-validator-api    │
│   (Next.js)             │──▶│   (FastAPI)             │
│   Port 8080             │   │   Port 8000             │
└─────────────────────────┘   └─────────────────────────┘
              │
              ▼
┌─────────────────────────┐
│   External Services     │
│   - CADC AC (Auth)      │
│   - DOI Service         │
│   - VOSpace Storage     │
└─────────────────────────┘
```

---

## Development

### Running Locally (without Docker)

```bash
# Frontend
cd frontend
npm install
npm run dev

# Validator API
cd api/validator
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

### Code Quality

```bash
cd frontend
npx tsc --noEmit        # Type check
npm run lint            # Lint
npm run format          # Format code
npm run test:run        # Run tests
```

---

## Production Deployment

### Option 1: Traefik (Recommended for subpath/subdomain)

For deployment behind an existing Traefik reverse proxy:

```bash
# Configure environment
cp .env.example .env
# Edit .env - set NEXTAUTH_URL, NEXTAUTH_SECRET, RAFTS_DOMAIN

# Subdomain deployment (rafts.example.com)
RAFTS_DOMAIN=rafts.example.com docker compose -f docker-compose.traefik.yml up -d --build

# Subpath deployment (example.com/rafts)
# 1. Set RAFTS_BASE_PATH=/rafts in .env
# 2. Set NEXT_PUBLIC_BASE_PATH=/rafts in .env
# 3. Edit docker-compose.traefik.yml - uncomment PathPrefix router rule
RAFTS_DOMAIN=example.com RAFTS_BASE_PATH=/rafts docker compose -f docker-compose.traefik.yml up -d --build
```

**Important for subpath deployment:**
- `NEXT_PUBLIC_BASE_PATH` is baked into the build - rebuild when changing
- Traefik should NOT strip the prefix (Next.js handles it via basePath)
- Set `NEXTAUTH_URL` to the full URL including the base path

### Option 2: Standalone with Nginx

For standalone deployment with included nginx:

```bash
./deploy.sh prod
```

### Option 3: With cadc-ui Infrastructure

For deployment alongside existing cadc-ui infrastructure:

```bash
cd frontend
docker compose -f docker-compose.prod.yml up -d --build
./scripts/post-deploy.sh
```

### SSL Certificates

For HTTPS with Let's Encrypt (standalone nginx):

1. Ensure your domain points to the server
2. Uncomment SSL server block in `nginx/conf.d/default.conf`
3. Run certbot:
   ```bash
   docker compose --profile ssl run certbot certonly \
     --webroot -w /var/www/certbot \
     -d your-domain.com
   ```
4. Restart nginx: `docker compose restart nginx`

---

## Health Endpoints

| Service | Endpoint | Response |
|---------|----------|----------|
| Frontend | `/api/health` | `{"status":"ok"}` |
| Validator | `/health-check` | `{"status":"healthy",...}` |

---

## Troubleshooting

### Logs

```bash
# All services
./deploy.sh logs

# Specific service
docker logs rafts-frontend-nextjs
docker logs ades-validator-api
```

### Common Issues

**Container won't start**
```bash
docker logs rafts-frontend-nextjs
docker inspect rafts-frontend-nextjs
```

**Validator not reachable from frontend**
- Ensure both containers are on the same network
- Check environment variables: `docker exec rafts-frontend-nextjs env | grep VALIDATOR`

**Authentication issues**
- Verify CADC AC service URLs in `.env`
- Check `NEXTAUTH_DEBUG=true` for detailed logs

---

## License

[Add license information]

## Contributing

[Add contribution guidelines]
