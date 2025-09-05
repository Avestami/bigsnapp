#!/bin/bash

# SnappClone Deployment Script
# This script automates the deployment process for the SnappClone application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="snappclone"
DOCKER_COMPOSE_FILE="docker-compose.yml"
PROD_COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"
ENV_EXAMPLE=".env.example"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi
    
    log_success "All requirements satisfied"
}

setup_environment() {
    log_info "Setting up environment configuration..."
    
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f "$ENV_EXAMPLE" ]; then
            cp "$ENV_EXAMPLE" "$ENV_FILE"
            log_warning "Created $ENV_FILE from $ENV_EXAMPLE"
            log_warning "Please review and update the environment variables in $ENV_FILE"
        else
            log_error "Neither $ENV_FILE nor $ENV_EXAMPLE found"
            exit 1
        fi
    else
        log_success "Environment file $ENV_FILE already exists"
    fi
}

generate_ssl_certificates() {
    log_info "Setting up SSL certificates..."
    
    SSL_DIR="./ssl"
    
    if [ ! -d "$SSL_DIR" ]; then
        mkdir -p "$SSL_DIR"
    fi
    
    if [ ! -f "$SSL_DIR/cert.pem" ] || [ ! -f "$SSL_DIR/key.pem" ]; then
        log_info "Generating self-signed SSL certificates for development..."
        
        openssl req -x509 -newkey rsa:4096 -keyout "$SSL_DIR/key.pem" -out "$SSL_DIR/cert.pem" \
            -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" 2>/dev/null
        
        log_warning "Self-signed certificates generated. For production, replace with valid certificates."
    else
        log_success "SSL certificates already exist"
    fi
}

build_images() {
    log_info "Building Docker images..."
    
    if [ "$1" = "prod" ]; then
        docker-compose -f "$DOCKER_COMPOSE_FILE" -f "$PROD_COMPOSE_FILE" build --no-cache
    else
        docker-compose build --no-cache
    fi
    
    log_success "Docker images built successfully"
}

start_services() {
    local mode="$1"
    log_info "Starting services in $mode mode..."
    
    if [ "$mode" = "prod" ]; then
        docker-compose -f "$DOCKER_COMPOSE_FILE" -f "$PROD_COMPOSE_FILE" up -d
    else
        docker-compose up -d
    fi
    
    log_success "Services started successfully"
}

stop_services() {
    log_info "Stopping services..."
    
    docker-compose down
    
    log_success "Services stopped successfully"
}

show_status() {
    log_info "Service status:"
    docker-compose ps
    
    echo ""
    log_info "Service logs (last 20 lines):"
    docker-compose logs --tail=20
}

show_urls() {
    log_info "Application URLs:"
    echo "  Admin Panel: https://localhost (or your domain)"
    echo "  API: https://localhost/api (or your domain/api)"
    echo "  Health Check: https://localhost/health"
    echo ""
    log_info "Database connections:"
    echo "  PostgreSQL: localhost:5432"
    echo "  Redis: localhost:6379"
    echo "  Prisma Studio: http://localhost:5555 (if enabled)"
}

run_migrations() {
    log_info "Running database migrations..."
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    sleep 10
    
    # Run Prisma migrations
    docker-compose exec backend npx prisma migrate deploy
    
    log_success "Database migrations completed"
}

seed_database() {
    log_info "Seeding database with initial data..."
    
    docker-compose exec backend npm run seed 2>/dev/null || log_warning "Seeding script not found or failed"
    
    log_success "Database seeding completed"
}

backup_database() {
    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
    log_info "Creating database backup: $backup_file"
    
    docker-compose exec postgres pg_dump -U postgres snapp_clone > "$backup_file"
    
    log_success "Database backup created: $backup_file"
}

restore_database() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        log_error "Please provide backup file path"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    log_info "Restoring database from: $backup_file"
    
    docker-compose exec -T postgres psql -U postgres -d snapp_clone < "$backup_file"
    
    log_success "Database restored successfully"
}

cleanup() {
    log_info "Cleaning up Docker resources..."
    
    # Stop and remove containers
    docker-compose down --remove-orphans
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes (be careful with this)
    read -p "Do you want to remove unused volumes? This will delete data! (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker volume prune -f
        log_warning "Unused volumes removed"
    fi
    
    log_success "Cleanup completed"
}

show_help() {
    echo "SnappClone Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  deploy [dev|prod]     Deploy the application (default: dev)"
    echo "  start [dev|prod]      Start services"
    echo "  stop                  Stop services"
    echo "  restart [dev|prod]    Restart services"
    echo "  status                Show service status and logs"
    echo "  logs [service]        Show logs for all services or specific service"
    echo "  migrate               Run database migrations"
    echo "  seed                  Seed database with initial data"
    echo "  backup                Create database backup"
    echo "  restore <file>        Restore database from backup"
    echo "  cleanup               Clean up Docker resources"
    echo "  urls                  Show application URLs"
    echo "  help                  Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy dev         Deploy in development mode"
    echo "  $0 deploy prod        Deploy in production mode"
    echo "  $0 logs backend       Show backend service logs"
    echo "  $0 restore backup.sql Restore from backup file"
}

# Main script logic
case "$1" in
    "deploy")
        MODE="${2:-dev}"
        check_requirements
        setup_environment
        if [ "$MODE" = "prod" ]; then
            generate_ssl_certificates
        fi
        build_images "$MODE"
        start_services "$MODE"
        sleep 5
        run_migrations
        seed_database
        show_urls
        log_success "Deployment completed successfully in $MODE mode!"
        ;;
    "start")
        MODE="${2:-dev}"
        start_services "$MODE"
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        MODE="${2:-dev}"
        stop_services
        start_services "$MODE"
        ;;
    "status")
        show_status
        ;;
    "logs")
        if [ -n "$2" ]; then
            docker-compose logs -f "$2"
        else
            docker-compose logs -f
        fi
        ;;
    "migrate")
        run_migrations
        ;;
    "seed")
        seed_database
        ;;
    "backup")
        backup_database
        ;;
    "restore")
        restore_database "$2"
        ;;
    "cleanup")
        cleanup
        ;;
    "urls")
        show_urls
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac