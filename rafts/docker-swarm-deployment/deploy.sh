#!/bin/bash
# =============================================================================
# RAFTS Docker Swarm Deployment
# =============================================================================
# Usage:
#   ./deploy.sh deploy   - Deploy or update the stack
#   ./deploy.sh remove   - Remove the stack
#   ./deploy.sh status   - Show service status
#   ./deploy.sh logs     - Tail service logs
# =============================================================================

set -e

STACK_NAME="rafts"
STACK_FILE="$(dirname "$0")/rafts-stack.yml"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()    { echo -e "[INFO] $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

deploy_stack() {
    log_info "Deploying stack '${STACK_NAME}'..."

    if [ ! -f "$STACK_FILE" ]; then
        log_error "Stack file not found: ${STACK_FILE}"
        exit 1
    fi

    docker stack deploy -c "$STACK_FILE" "$STACK_NAME"
    log_success "Stack '${STACK_NAME}' deployed"

    log_info "Waiting for services to converge..."
    sleep 10
    show_status
}

remove_stack() {
    log_warn "Removing stack '${STACK_NAME}'..."
    docker stack rm "$STACK_NAME"
    log_success "Stack '${STACK_NAME}' removed"
}

show_status() {
    echo ""
    echo "Services:"
    echo "========="
    docker stack services "$STACK_NAME" 2>/dev/null || log_warn "Stack not running"

    echo ""
    echo "Tasks:"
    echo "======"
    docker stack ps "$STACK_NAME" --no-trunc 2>/dev/null || true
    echo ""
}

show_logs() {
    local service="${2:-}"
    if [ -n "$service" ]; then
        docker service logs -f "${STACK_NAME}_${service}"
    else
        log_info "Specify a service: rafts-frontend | rafts-ades-validator"
        docker stack services "$STACK_NAME" 2>/dev/null
    fi
}

case "${1:-}" in
    deploy)  deploy_stack ;;
    remove)  remove_stack ;;
    status)  show_status ;;
    logs)    show_logs "$@" ;;
    *)
        echo "Usage: $0 {deploy|remove|status|logs [service]}"
        echo ""
        echo "Commands:"
        echo "  deploy  - Deploy or update the RAFTS stack"
        echo "  remove  - Remove the RAFTS stack"
        echo "  status  - Show service status and tasks"
        echo "  logs    - Tail logs (specify service name)"
        echo ""
        echo "Environment variables:"
        echo "  RAFTS_FRONTEND_IMAGE   - Frontend image (default: bucket.canfar.net/rafts-frontend:latest)"
        echo "  ADES_VALIDATOR_IMAGE   - Validator image (default: bucket.canfar.net/ades-validator-api:latest)"
        exit 1
        ;;
esac
