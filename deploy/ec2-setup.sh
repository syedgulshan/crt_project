#!/usr/bin/env bash
# ==============================================================================
# AWS EC2 Automated Deployment Script for Requirement Conflict & Overlap Analyzer
# Supported OS: Ubuntu 22.04 / 24.04 LTS & Amazon Linux 2023
# ==============================================================================

set -e

echo "=================================================================="
echo " Starting AWS EC2 Setup for Requirement Conflict Analyzer..."
echo "=================================================================="

# 1. Update OS packages
echo "[1/7] Updating system packages..."
if [ -f /etc/debian_version ]; then
    sudo apt-get update -y && sudo apt-get upgrade -y
    sudo apt-get install -y curl wget git build-essential nginx ufw
elif [ -f /etc/redhat-release ] || [ -f /etc/amazon-linux-release ]; then
    sudo dnf update -y
    sudo dnf install -y curl wget git gcc-c++ make nginx
fi

# 2. Install Node.js 22 LTS
echo "[2/7] Installing Node.js LTS..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# 3. Install PM2 process manager
echo "[3/7] Installing PM2 process manager globally..."
sudo npm install -g pm2 tsx

# 4. Clone / Navigate to project directory
APP_DIR="/var/www/requirement-analyzer"
echo "[4/7] Setting up application directory at ${APP_DIR}..."

sudo mkdir -p ${APP_DIR}
sudo chown -R $USER:$USER ${APP_DIR}

# If current directory contains code, copy or git clone
if [ -f "./package.json" ]; then
    cp -r ./* ${APP_DIR}/
fi

cd ${APP_DIR}

# 5. Install Dependencies & Build Production Bundle
echo "[5/7] Installing root & client dependencies..."
npm install
npm --prefix client install
echo "Building client frontend bundle..."
npm --prefix client run build

# Ensure data and uploads directory exist
mkdir -p data uploads

# Create default .env if missing
if [ ! -f .env ]; then
    echo "Creating production .env..."
    cp .env.example .env
    sed -i 's/NODE_ENV=development/NODE_ENV=production/' .env
    sed -i 's/PORT=5000/PORT=5000/' .env
fi

# 6. Configure Nginx Reverse Proxy
echo "[6/7] Configuring Nginx reverse proxy..."
sudo cp deploy/nginx.conf /etc/nginx/sites-available/requirement-analyzer 2>/dev/null || sudo cp deploy/nginx.conf /etc/nginx/conf.d/requirement-analyzer.conf

if [ -d /etc/nginx/sites-enabled ]; then
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo ln -sf /etc/nginx/sites-available/requirement-analyzer /etc/nginx/sites-enabled/
fi

sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# 7. Start Application with PM2
echo "[7/7] Launching application with PM2 process manager..."
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup | tail -n 1 | sudo bash || true

# Configure Firewall
if command -v ufw &> /dev/null; then
    sudo ufw allow OpenSSH
    sudo ufw allow 'Nginx Full'
    sudo ufw --force enable
fi

echo "=================================================================="
echo " DEPLOYMENT COMPLETE! "
echo " Application is running on http://$(curl -s ifconfig.me)"
echo " PM2 status: run 'pm2 status'"
echo " Logs: run 'pm2 logs requirement-analyzer'"
echo "=================================================================="
