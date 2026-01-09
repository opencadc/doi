#!/bin/bash
# =============================================================================
# RAFTS Deployment Script
# =============================================================================
# Usage:
#   ./deploy.sh setup    - Interactive setup wizard
#   ./deploy.sh dev      - Start development environment
#   ./deploy.sh prod     - Start production environment
#   ./deploy.sh traefik  - Deploy behind Traefik reverse proxy
#   ./deploy.sh stop     - Stop all services
#   ./deploy.sh logs     - View logs
#   ./deploy.sh health   - Check service health
#   ./deploy.sh clean    - Stop and remove all containers/images
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${CYAN}[STEP]${NC} $1"; }

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi

    if [ ! -f ".env" ]; then
        log_warn ".env file not found. Creating from .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_warn "Please edit .env and configure your settings, then run this script again."
            exit 1
        else
            log_error ".env.example not found. Cannot create configuration."
            exit 1
        fi
    fi

    log_success "Prerequisites check passed"
}

# Start development environment
start_dev() {
    log_info "Starting RAFTS development environment..."
    check_prerequisites

    docker compose --profile dev up --build "$@"
}

# Start production environment
start_prod() {
    log_info "Starting RAFTS production environment..."
    check_prerequisites

    # Validate critical environment variables
    source .env
    if [ "$NEXTAUTH_SECRET" = "CHANGE_ME_generate_with_openssl_rand_base64_32" ]; then
        log_error "NEXTAUTH_SECRET has not been configured. Please update .env"
        exit 1
    fi

    docker compose --profile prod up -d --build "$@"

    log_info "Waiting for services to be healthy..."
    sleep 10

    health_check
}

# Stop all services
stop_services() {
    log_info "Stopping RAFTS services..."
    docker compose --profile dev --profile prod down
    log_success "Services stopped"
}

# View logs
view_logs() {
    docker compose --profile dev --profile prod logs -f "$@"
}

# Health check
health_check() {
    log_info "Checking service health..."

    echo ""
    echo "Container Status:"
    echo "================="
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(rafts|ades|NAMES)" || true

    echo ""
    echo "Health Checks:"
    echo "=============="

    # Check validator
    if curl -sf http://localhost:8000/health-check > /dev/null 2>&1; then
        log_success "Validator API: Healthy"
    else
        log_warn "Validator API: Not responding (may be internal only)"
    fi

    # Check frontend (via nginx if prod, direct if dev)
    if curl -sf http://localhost:3080/api/health > /dev/null 2>&1; then
        log_success "Frontend: Healthy at http://localhost:3080"
    elif curl -sf http://localhost/api/health > /dev/null 2>&1; then
        log_success "Frontend (prod/nginx): Healthy at http://localhost"
    elif curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
        log_success "Frontend (dev): Healthy at http://localhost:3000"
    else
        log_warn "Frontend: Not responding yet (may still be starting)"
    fi

    echo ""
}

# Clean up everything
clean_all() {
    log_warn "This will remove all RAFTS containers and images."
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Cleaning up..."
        docker compose --profile dev --profile prod --profile ssl down -v --rmi local 2>/dev/null || true
        docker compose -f docker-compose.traefik.yml down -v --rmi local 2>/dev/null || true
        log_success "Cleanup complete"
    else
        log_info "Cleanup cancelled"
    fi
}

# Interactive setup wizard
setup_wizard() {
    echo ""
    echo -e "${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}║           RAFTS Deployment Setup Wizard                    ║${NC}"
    echo -e "${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Check if .env already exists
    if [ -f ".env" ]; then
        log_warn ".env file already exists."
        read -p "Overwrite with fresh configuration? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Setup cancelled. Using existing .env"
            return 0
        fi
    fi

    # Copy template
    if [ ! -f ".env.example" ]; then
        log_error ".env.example not found. Cannot proceed with setup."
        exit 1
    fi
    cp .env.example .env

    echo ""
    log_step "Step 1/4: Deployment Type"
    echo ""
    echo "  1) Development (local testing with hot reload)"
    echo "  2) Production with Nginx (standalone server)"
    echo "  3) Production with Traefik (behind existing reverse proxy)"
    echo ""
    read -p "Select deployment type [1-3]: " deploy_type

    case "$deploy_type" in
        1)
            DEPLOY_MODE="dev"
            log_info "Development mode selected"
            ;;
        2)
            DEPLOY_MODE="prod"
            log_info "Production with Nginx selected"
            ;;
        3)
            DEPLOY_MODE="traefik"
            log_info "Traefik deployment selected"
            ;;
        *)
            log_warn "Invalid selection, defaulting to development"
            DEPLOY_MODE="dev"
            ;;
    esac

    echo ""
    log_step "Step 2/4: Domain Configuration"
    echo ""

    if [ "$DEPLOY_MODE" = "dev" ]; then
        DOMAIN="localhost"
        BASE_PATH=""
        NEXTAUTH_URL="http://localhost:3000"
    else
        read -p "Enter your domain (e.g., rafts.example.com): " DOMAIN
        DOMAIN=${DOMAIN:-rafts.localhost}

        echo ""
        echo "Deployment path options:"
        echo "  1) Root domain (https://${DOMAIN}/)"
        echo "  2) Subpath (https://${DOMAIN}/rafts)"
        echo ""
        read -p "Select path option [1-2]: " path_option

        if [ "$path_option" = "2" ]; then
            read -p "Enter subpath (e.g., /rafts): " BASE_PATH
            BASE_PATH=${BASE_PATH:-/rafts}
            NEXTAUTH_URL="https://${DOMAIN}${BASE_PATH}"
        else
            BASE_PATH=""
            NEXTAUTH_URL="https://${DOMAIN}"
        fi
    fi

    echo ""
    log_step "Step 3/4: Security Configuration"
    echo ""

    # Generate secret
    NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
    log_success "Generated secure NEXTAUTH_SECRET"

    echo ""
    log_step "Step 4/4: Traefik Configuration (if applicable)"

    if [ "$DEPLOY_MODE" = "traefik" ]; then
        echo ""
        read -p "Traefik network name [traefik_proxy]: " TRAEFIK_NETWORK
        TRAEFIK_NETWORK=${TRAEFIK_NETWORK:-traefik_proxy}

        read -p "Traefik entrypoint [websecure]: " TRAEFIK_ENTRYPOINT
        TRAEFIK_ENTRYPOINT=${TRAEFIK_ENTRYPOINT:-websecure}

        read -p "Traefik cert resolver [letsencrypt]: " TRAEFIK_CERTRESOLVER
        TRAEFIK_CERTRESOLVER=${TRAEFIK_CERTRESOLVER:-letsencrypt}

        # Verify Traefik network exists
        if ! docker network ls | grep -q "$TRAEFIK_NETWORK"; then
            log_warn "Network '$TRAEFIK_NETWORK' not found. Make sure it exists before deploying."
        fi
    else
        TRAEFIK_NETWORK="traefik_proxy"
        TRAEFIK_ENTRYPOINT="websecure"
        TRAEFIK_CERTRESOLVER="letsencrypt"
    fi

    # Update .env file
    log_info "Writing configuration to .env..."

    sed -i.bak "s|^RAFTS_DOMAIN=.*|RAFTS_DOMAIN=${DOMAIN}|" .env
    sed -i.bak "s|^RAFTS_BASE_PATH=.*|RAFTS_BASE_PATH=${BASE_PATH}|" .env
    sed -i.bak "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=${NEXTAUTH_URL}|" .env
    sed -i.bak "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=${NEXTAUTH_SECRET}|" .env
    sed -i.bak "s|^NEXT_PUBLIC_BASE_PATH=.*|NEXT_PUBLIC_BASE_PATH=${BASE_PATH}|" .env

    if [ "$DEPLOY_MODE" = "traefik" ]; then
        sed -i.bak "s|^# TRAEFIK_NETWORK=.*|TRAEFIK_NETWORK=${TRAEFIK_NETWORK}|" .env
        sed -i.bak "s|^# TRAEFIK_ENTRYPOINT=.*|TRAEFIK_ENTRYPOINT=${TRAEFIK_ENTRYPOINT}|" .env
        sed -i.bak "s|^# TRAEFIK_CERTRESOLVER=.*|TRAEFIK_CERTRESOLVER=${TRAEFIK_CERTRESOLVER}|" .env
    fi

    # Clean up backup files
    rm -f .env.bak

    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                  Setup Complete!                           ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Configuration saved to .env"
    echo ""
    echo "Next steps:"
    echo "  1. Review and adjust .env if needed (especially CADC settings)"
    echo ""

    case "$DEPLOY_MODE" in
        dev)
            echo "  2. Run: ./deploy.sh dev"
            echo "  3. Access: http://localhost:3000"
            ;;
        prod)
            echo "  2. Run: ./deploy.sh prod"
            echo "  3. Access: http://${DOMAIN}"
            ;;
        traefik)
            echo "  2. Run: ./deploy.sh traefik"
            echo "  3. Access: https://${DOMAIN}${BASE_PATH}"
            ;;
    esac
    echo ""
}

# Deploy with Traefik
start_traefik() {
    log_info "Deploying RAFTS behind Traefik..."
    check_prerequisites

    # Validate configuration
    source .env

    if [ "$NEXTAUTH_SECRET" = "CHANGE_ME_generate_with_openssl_rand_base64_32" ]; then
        log_error "NEXTAUTH_SECRET not configured. Run './deploy.sh setup' first."
        exit 1
    fi

    TRAEFIK_NETWORK=${TRAEFIK_NETWORK:-traefik_proxy}

    # Check Traefik network
    if ! docker network ls --format '{{.Name}}' | grep -q "^${TRAEFIK_NETWORK}$"; then
        log_error "Traefik network '${TRAEFIK_NETWORK}' not found."
        log_info "Create it with: docker network create ${TRAEFIK_NETWORK}"
        log_info "Or update TRAEFIK_NETWORK in .env"
        exit 1
    fi

    log_info "Using Traefik network: ${TRAEFIK_NETWORK}"
    log_info "Domain: ${RAFTS_DOMAIN:-rafts.localhost}"
    [ -n "${RAFTS_BASE_PATH}" ] && log_info "Base path: ${RAFTS_BASE_PATH}"

    # Build and deploy
    docker compose -f docker-compose.traefik.yml up -d --build "$@"

    log_info "Waiting for services to be healthy..."
    sleep 15

    # Health check
    echo ""
    echo "Container Status:"
    echo "================="
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(rafts|ades|NAMES)" || true

    echo ""
    log_success "Deployment complete!"
    echo ""

    if [ -n "${RAFTS_BASE_PATH}" ]; then
        echo "Access your application at: https://${RAFTS_DOMAIN}${RAFTS_BASE_PATH}"
    else
        echo "Access your application at: https://${RAFTS_DOMAIN}"
    fi
    echo ""
}

# Stop Traefik deployment
stop_traefik() {
    log_info "Stopping Traefik deployment..."
    docker compose -f docker-compose.traefik.yml down
    log_success "Traefik deployment stopped"
}

# Show usage
show_usage() {
    echo ""
    echo -e "${BOLD}RAFTS Deployment Script${NC}"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo -e "${BOLD}Commands:${NC}"
    echo "  setup    Interactive setup wizard (recommended for first-time setup)"
    echo "  dev      Start development environment (with hot reload)"
    echo "  prod     Start production environment (with nginx)"
    echo "  traefik  Deploy behind existing Traefik reverse proxy"
    echo "  stop     Stop all services"
    echo "  logs     View logs (add service name to filter)"
    echo "  health   Check service health status"
    echo "  clean    Remove all containers and images"
    echo ""
    echo -e "${BOLD}Quick Start:${NC}"
    echo "  $0 setup                  # Run setup wizard (first time)"
    echo "  $0 traefik                # Deploy with Traefik"
    echo ""
    echo -e "${BOLD}Examples:${NC}"
    echo "  $0 setup                  # Interactive configuration"
    echo "  $0 dev                    # Start dev environment"
    echo "  $0 dev -d                 # Start dev in detached mode"
    echo "  $0 prod                   # Start production with nginx"
    echo "  $0 traefik                # Deploy behind Traefik"
    echo "  $0 logs rafts-frontend    # View frontend logs only"
    echo "  $0 health                 # Check all services"
    echo "  $0 stop                   # Stop all running services"
    echo ""
    echo -e "${BOLD}For Traefik Deployment:${NC}"
    echo "  1. Run: $0 setup          # Select option 3 for Traefik"
    echo "  2. Review .env file"
    echo "  3. Run: $0 traefik"
    echo ""
}

# Main
case "${1:-}" in
    setup)
        setup_wizard
        ;;
    dev)
        shift
        start_dev "$@"
        ;;
    prod)
        shift
        start_prod "$@"
        ;;
    traefik)
        shift
        start_traefik "$@"
        ;;
    stop)
        stop_services
        # Also stop Traefik deployment if running
        docker compose -f docker-compose.traefik.yml down 2>/dev/null || true
        ;;
    logs)
        shift
        view_logs "$@"
        ;;
    health)
        health_check
        ;;
    clean)
        clean_all
        ;;
    *)
        show_usage
        exit 1
        ;;
esac
