#!/bin/bash
# ============================================================
# Keyword Key — Hostinger VPS Deployment Script
# ============================================================
# This script automates the deployment of the Keyword Key app
# on a Hostinger VPS running Ubuntu 22.04/24.04.
#
# Usage:
#   chmod +x deploy-hostinger.sh
#   sudo ./deploy-hostinger.sh
#
# Or step by step (if you prefer manual control):
#   ./deploy-hostinger.sh install   — install dependencies (Node, Bun, PM2, Nginx, PostgreSQL)
#   ./deploy-hostinger.sh setup     — setup database and build app
#   ./deploy-hostinger.sh deploy    — pull latest code, build, restart PM2
#   ./deploy-hostinger.sh ssl       — install SSL certificate with Certbot
#   ./deploy-hostinger.sh status    — check status of all services
# ============================================================

set -e

# --- Configuration ---
APP_NAME="keyword-key"
APP_DIR="/var/www/keyword-key"
APP_USER="www-data"
NODE_VERSION="20"
PORT=3000
REPO_URL="https://github.com/ali452158/keyword-key.git"
DOMAIN="your-domain.com"  # ← CHANGE THIS to your actual domain

# --- Colors for output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARN:${NC} $1"; }
err() { echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $1" >&2; }
info() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }

# ============================================================
# Install dependencies on fresh VPS
# ============================================================
install_dependencies() {
    log "Installing system dependencies..."

    # Update system
    apt update && apt upgrade -y

    # Install essential packages
    apt install -y curl wget git build-essential nginx ufw

    # Install Node.js 20 LTS via NodeSource
    if ! command -v node &> /dev/null; then
        log "Installing Node.js ${NODE_VERSION}..."
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
        apt install -y nodejs
    fi

    # Install Bun
    if ! command -v bun &> /dev/null; then
        log "Installing Bun..."
        curl -fsSL https://bun.sh/install | bash
        export BUN_INSTALL="$HOME/.bun"
        export PATH="$BUN_INSTALL/bin:$PATH"
        # Add to bashrc for all users
        echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
        echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc
    fi

    # Install PM2 globally
    if ! command -v pm2 &> /dev/null; then
        log "Installing PM2..."
        npm install -g pm2
    fi

    # Install PostgreSQL 16
    if ! command -v psql &> /dev/null; then
        log "Installing PostgreSQL..."
        sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
        curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
        apt update
        apt install -y postgresql postgresql-contrib
    fi

    # Install Certbot for SSL
    if ! command -v certbot &> /dev/null; then
        log "Installing Certbot..."
        apt install -y certbot python3-certbot-nginx
    fi

    # Configure firewall
    log "Configuring firewall..."
    ufw allow OpenSSH
    ufw allow 'Nginx Full'
    ufw --force enable

    log "✅ All dependencies installed!"
    info "Node.js: $(node --version)"
    info "npm: $(npm --version)"
    info "PM2: $(pm2 --version)"
    info "Nginx: $(nginx -v 2>&1)"
    info "PostgreSQL: $(psql --version)"
}

# ============================================================
# Setup PostgreSQL database
# ============================================================
setup_database() {
    log "Setting up PostgreSQL database..."

    DB_NAME="keywordkey"
    DB_USER="keywordkey"
    DB_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)

    # Create database and user
    sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null || warn "Database ${DB_NAME} already exists"
    sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';" 2>/dev/null || warn "User ${DB_USER} already exists"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" 2>/dev/null
    sudo -u postgres psql -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS}';" 2>/dev/null

    # For PostgreSQL 15+, grant schema permissions
    sudo -u postgres psql -d ${DB_NAME} -c "GRANT ALL ON SCHEMA public TO ${DB_USER};" 2>/dev/null

    DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?schema=public"

    log "✅ Database created!"
    info "Database URL: ${DATABASE_URL}"
    warn "Save this URL — you'll need it for .env"

    echo "${DATABASE_URL}" > /tmp/keyword-key-db-url.txt
    info "Database URL saved to /tmp/keyword-key-db-url.txt"
}

# ============================================================
# Clone repository and setup app
# ============================================================
setup_app() {
    log "Setting up application..."

    # Create app directory
    mkdir -p ${APP_DIR}
    cd ${APP_DIR}

    # Clone repository (or pull if exists)
    if [ -d "${APP_DIR}/.git" ]; then
        log "Repository exists, pulling latest..."
        git pull origin main
    else
        log "Cloning repository..."
        git clone ${REPO_URL} ${APP_DIR}
    fi

    # Create .env file
    if [ ! -f "${APP_DIR}/.env" ]; then
        log "Creating .env file..."
        DB_URL=$(cat /tmp/keyword-key-db-url.txt 2>/dev/null || echo "postgresql://keywordkey:PASSWORD@localhost:5432/keywordkey?schema=public")
        NEXTAUTH_SECRET=$(openssl rand -base64 32)

        cat > ${APP_DIR}/.env << EOF
DATABASE_URL=${DB_URL}
NEXTAUTH_URL=http://${DOMAIN}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
EOF
        chmod 600 ${APP_DIR}/.env
        log ".env created with secure values"
    fi

    # Install dependencies
    log "Installing dependencies with Bun..."
    export PATH="$HOME/.bun/bin:$PATH"
    bun install

    # Generate Prisma client
    log "Generating Prisma client..."
    bunx prisma generate

    # Push database schema
    log "Creating database tables..."
    bunx prisma db push --accept-data-loss

    # Build the application
    log "Building Next.js app (this may take a few minutes)..."
    bun run build

    # Copy static files to standalone (required for standalone output)
    log "Copying static assets..."
    cp -r .next/static .next/standalone/.next/
    cp -r public .next/standalone/

    # Create logs directory
    mkdir -p ${APP_DIR}/logs

    # Set permissions
    chown -R ${APP_USER}:${APP_USER} ${APP_DIR}

    log "✅ Application built successfully!"
}

# ============================================================
# Start with PM2
# ============================================================
start_pm2() {
    log "Starting app with PM2..."

    cd ${APP_DIR}

    # Load environment from .env
    export $(grep -v '^#' .env | xargs)

    # Start or restart PM2
    if pm2 describe ${APP_NAME} > /dev/null 2>&1; then
        log "Restarting existing PM2 process..."
        pm2 restart ${APP_NAME}
    else
        log "Starting new PM2 process..."
        pm2 start ecosystem.config.cjs --env production
    fi

    # Save PM2 process list
    pm2 save

    # Setup PM2 startup on boot
    pm2 startup systemd -u root --hp /root 2>/dev/null || true

    log "✅ App started with PM2!"
    info "Status:"
    pm2 status
}

# ============================================================
# Configure Nginx
# ============================================================
configure_nginx() {
    log "Configuring Nginx..."

    NGINX_CONF="/etc/nginx/sites-available/${APP_NAME}"

    # Copy Nginx config
    cp ${APP_DIR}/nginx-keyword-key.conf ${NGINX_CONF}

    # Replace domain placeholder
    sed -i "s/your-domain.com/${DOMAIN}/g" ${NGINX_CONF}

    # Enable site
    ln -sf ${NGINX_CONF} /etc/nginx/sites-enabled/

    # Remove default site
    rm -f /etc/nginx/sites-enabled/default

    # Test Nginx config
    if nginx -t; then
        log "Nginx config test passed, reloading..."
        systemctl reload nginx
        log "✅ Nginx configured!"
    else
        err "Nginx config test failed!"
        exit 1
    fi
}

# ============================================================
# Install SSL certificate
# ============================================================
install_ssl() {
    log "Installing SSL certificate with Certbot..."

    if [ "${DOMAIN}" = "your-domain.com" ]; then
        err "Please set your actual domain in the DOMAIN variable at the top of this script!"
        err "Edit: ${APP_DIR}/deploy-hostinger.sh"
        exit 1
    fi

    certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos -m admin@${DOMAIN} --redirect

    log "✅ SSL certificate installed!"
    info "Your site is now available at: https://${DOMAIN}"
}

# ============================================================
# Deploy (pull latest + rebuild + restart)
# ============================================================
deploy() {
    log "Deploying latest changes..."

    cd ${APP_DIR}
    git pull origin main

    export PATH="$HOME/.bun/bin:$PATH"
    bun install
    bunx prisma generate
    bunx prisma db push --accept-data-loss
    bun run build
    cp -r .next/static .next/standalone/.next/
    cp -r public .next/standalone/

    pm2 restart ${APP_NAME}
    log "✅ Deployment complete!"
}

# ============================================================
# Check status of all services
# ============================================================
status() {
    info "=== Service Status ==="
    echo ""
    log "Node.js:"
    node --version 2>/dev/null || err "Not installed"
    echo ""
    log "PM2 processes:"
    pm2 status 2>/dev/null || err "PM2 not running"
    echo ""
    log "Nginx:"
    systemctl status nginx --no-pager -l 2>/dev/null | head -5 || err "Nginx not running"
    echo ""
    log "PostgreSQL:"
    systemctl status postgresql --no-pager -l 2>/dev/null | head -5 || err "PostgreSQL not running"
    echo ""
    log "App health check:"
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:${PORT}/ | grep -q "200"; then
        echo "✅ App responding on port ${PORT}"
    else
        err "App not responding on port ${PORT}"
    fi
}

# ============================================================
# Main
# ============================================================
case "${1:-all}" in
    install)
        install_dependencies
        ;;
    database)
        setup_database
        ;;
    setup)
        setup_app
        ;;
    pm2)
        start_pm2
        ;;
    nginx)
        configure_nginx
        ;;
    ssl)
        install_ssl
        ;;
    deploy)
        deploy
        ;;
    status)
        status
        ;;
    all)
        log "🚀 Full deployment starting..."
        install_dependencies
        setup_database
        setup_app
        start_pm2
        configure_nginx
        log ""
        log "========================================"
        log "✅ Deployment complete!"
        log "========================================"
        info "Next steps:"
        info "1. Edit DOMAIN variable in deploy-hostinger.sh"
        info "2. Run: sudo ./deploy-hostinger.sh ssl"
        info "3. Point your domain DNS to this server's IP"
        info "4. Update NEXTAUTH_URL in ${APP_DIR}/.env to https://${DOMAIN}"
        info "5. Restart PM2: pm2 restart ${APP_NAME}"
        ;;
    *)
        echo "Usage: $0 {install|database|setup|pm2|nginx|ssl|deploy|status|all}"
        exit 1
        ;;
esac
