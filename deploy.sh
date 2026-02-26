#!/bin/bash

# Stratos Self-Hosting Deployment Script
# This script sets up Docker, Docker Compose, and deploys the application

set -e  # Exit on error

echo "=========================================="
echo "Stratos Self-Hosting Setup"
echo "=========================================="
echo ""

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   echo "⚠️  This script must be run with sudo"
   echo "Usage: sudo bash deploy.sh"
   exit 1
fi

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Update system
echo -e "${YELLOW}[1/6] Updating system packages...${NC}"
apt update && apt upgrade -y

# Step 2: Install Docker
echo -e "${YELLOW}[2/6] Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker $USER
    rm get-docker.sh
else
    echo "✓ Docker already installed"
fi

# Step 3: Install Docker Compose
echo -e "${YELLOW}[3/6] Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "✓ Docker Compose already installed"
fi

# Step 4: Install Certbot for SSL
echo -e "${YELLOW}[4/6] Installing Certbot for SSL certificates...${NC}"
apt install -y certbot python3-certbot-nginx

# Step 5: Ask for domain
echo ""
echo -e "${YELLOW}[5/6] Configuration${NC}"
read -p "Enter your domain (e.g., yourdomain.com): " DOMAIN
read -p "Enter your email for Let's Encrypt: " EMAIL

# Step 6: Generate SSL Certificate
echo -e "${YELLOW}[6/6] Generating SSL certificate...${NC}"
echo ""
echo "⚠️  Make sure your domain points to this server before continuing!"
echo "Add an A record pointing $DOMAIN to your server's IP address"
read -p "Press Enter when DNS is configured..."

certbot certonly --standalone \
  -d $DOMAIN \
  -d www.$DOMAIN \
  --non-interactive \
  --agree-tos \
  --email $EMAIL

# Create SSL directory
mkdir -p ssl
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/cert.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/key.pem

echo ""
echo -e "${GREEN}=========================================="
echo "✓ Prerequisites installed successfully!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your configuration"
echo "2. Run: docker-compose build"
echo "3. Run: docker-compose up -d"
echo "4. Check: docker-compose ps"
echo ""
echo "View logs with: docker-compose logs -f"
echo ""
