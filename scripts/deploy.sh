#!/bin/bash

# ================================
# EMAILIGHT PRODUCTION DEPLOYMENT SCRIPT
# ================================
# This script handles the deployment of Emailight to production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/opt/emailight"
BACKUP_DIR="/opt/backups/emailight"
LOG_FILE="/var/log/emailight-deploy.log"
DATE=$(date +%Y%m%d_%H%M%S)

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌${NC} $1" | tee -a "$LOG_FILE"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check service health
check_service_health() {
    local service_name=$1
    local health_url=$2
    local max_attempts=30
    local attempt=1

    log "Checking health of $service_name..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$health_url" > /dev/null 2>&1; then
            log_success "$service_name is healthy"
            return 0
        fi
        
        log "Attempt $attempt/$max_attempts: $service_name not ready yet, waiting..."
        sleep 10
        ((attempt++))
    done
    
    log_error "$service_name failed health check after $max_attempts attempts"
    return 1
}

# Function to create backup
create_backup() {
    log "Creating backup of current deployment..."
    
    if [ -d "$PROJECT_DIR/docker" ]; then
        mkdir -p "$BACKUP_DIR"
        tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" -C "$PROJECT_DIR" . 2>/dev/null || {
            log_warning "Failed to create backup, continuing..."
            return 0
        }
        
        # Keep only last 5 backups
        ls -t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm
        
        log_success "Backup created: backup_$DATE.tar.gz"
    else
        log "No existing deployment found, skipping backup"
    fi
}

# Function to stop services
stop_services() {
    log "Stopping current services..."
    
    cd "$PROJECT_DIR/docker" || {
        log_warning "Docker directory not found, skipping service stop"
        return 0
    }
    
    if [ -f "docker-compose.prod.yml" ]; then
        docker compose -f docker-compose.prod.yml down --remove-orphans || {
            log_warning "Failed to stop some services, continuing..."
        }
        log_success "Services stopped"
    else
        log "No docker-compose.prod.yml found, skipping service stop"
    fi
}

# Function to clean up old images
cleanup_images() {
    log "Cleaning up old Docker images..."
    
    # Remove unused images
    docker image prune -f || {
        log_warning "Failed to prune some images, continuing..."
    }
    
    # Remove dangling images
    docker images -f "dangling=true" -q | xargs -r docker rmi || {
        log_warning "Failed to remove some dangling images, continuing..."
    }
    
    log_success "Docker cleanup completed"
}

# Function to start services
start_services() {
    log "Starting services..."
    
    cd "$PROJECT_DIR/docker" || {
        log_error "Docker directory not found"
        exit 1
    }
    
    # Build and start services
    docker compose -f docker-compose.prod.yml up -d --build || {
        log_error "Failed to start services"
        exit 1
    }
    
    log_success "Services started"
}

# Function to configure Nginx
configure_nginx() {
    log "Configuring Nginx..."
    
    # Copy Nginx configuration
    if [ -f "$PROJECT_DIR/nginx/emailight.conf" ]; then
        cp "$PROJECT_DIR/nginx/emailight.conf" /etc/nginx/sites-available/ || {
            log_error "Failed to copy Nginx configuration"
            exit 1
        }
        
        # Enable site
        ln -sf /etc/nginx/sites-available/emailight.conf /etc/nginx/sites-enabled/ || {
            log_error "Failed to enable Nginx site"
            exit 1
        }
        
        # Test Nginx configuration
        nginx -t || {
            log_error "Nginx configuration test failed"
            exit 1
        }
        
        # Reload Nginx
        systemctl reload nginx || {
            log_error "Failed to reload Nginx"
            exit 1
        }
        
        log_success "Nginx configured and reloaded"
    else
        log_warning "Nginx configuration file not found, skipping Nginx setup"
    fi
}

# Function to run health checks
run_health_checks() {
    log "Running health checks..."
    
    # Check user service
    check_service_health "User Service" "http://localhost:3001/health" || {
        log_error "User service health check failed"
        return 1
    }
    
    # Check MongoDB
    docker exec emailight-mongodb-prod mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1 || {
        log_error "MongoDB health check failed"
        return 1
    }
    log_success "MongoDB is healthy"
    
    # Check Redis
    docker exec emailight-redis-prod redis-cli ping > /dev/null 2>&1 || {
        log_error "Redis health check failed"
        return 1
    }
    log_success "Redis is healthy"
    
    # Check Exceptionless (optional)
    if curl -f -s "http://localhost:5000/health" > /dev/null 2>&1; then
        log_success "Exceptionless is healthy"
    else
        log_warning "Exceptionless health check failed (optional service)"
    fi
    
    log_success "All health checks passed"
}

# Function to show deployment summary
show_summary() {
    log_success "Deployment completed successfully!"
    echo ""
    echo "🌐 Application URLs:"
    echo "   - Main API: https://emailight.com/api/v1"
    echo "   - Health Check: https://emailight.com/health"
    echo "   - API Docs: https://emailight.com/docs"
    echo "   - Monitoring: https://emailight.com/monitoring"
    echo ""
    echo "📊 Service Status:"
    cd "$PROJECT_DIR/docker"
    docker compose -f docker-compose.prod.yml ps
    echo ""
    echo "📝 Useful Commands:"
    echo "   - View logs: docker compose -f docker-compose.prod.yml logs -f"
    echo "   - Restart: docker compose -f docker-compose.prod.yml restart"
    echo "   - Status: docker compose -f docker-compose.prod.yml ps"
    echo ""
}

# Function to handle errors
handle_error() {
    log_error "Deployment failed at line $1"
    log_error "Check the logs for more details: $LOG_FILE"
    
    # Try to restore from backup if available
    if [ -f "$BACKUP_DIR/backup_$DATE.tar.gz" ]; then
        log "Attempting to restore from backup..."
        cd "$PROJECT_DIR"
        tar -xzf "$BACKUP_DIR/backup_$DATE.tar.gz" || {
            log_error "Failed to restore from backup"
        }
    fi
    
    exit 1
}

# Set up error handling
trap 'handle_error $LINENO' ERR

# Main deployment function
main() {
    log "Starting Emailight production deployment..."
    log "Deployment ID: $DATE"
    
    # Check prerequisites
    if ! command_exists docker; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    if ! command_exists nginx; then
        log_error "Nginx is not installed"
        exit 1
    fi
    
    # Create necessary directories
    mkdir -p "$PROJECT_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Run deployment steps
    create_backup
    stop_services
    cleanup_images
    start_services
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 30
    
    run_health_checks
    configure_nginx
    
    # Final health check
    log "Running final health check..."
    sleep 10
    check_service_health "API Endpoint" "https://emailight.com/health" || {
        log_warning "Final health check failed, but deployment may still be successful"
    }
    
    show_summary
    
    log_success "Deployment completed successfully!"
}

# Run main function
main "$@"
