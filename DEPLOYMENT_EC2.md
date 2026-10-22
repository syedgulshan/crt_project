# AWS EC2 Production Deployment Guide

This guide provides step-by-step instructions for deploying the **Requirement Conflict & Overlap Analyzer** to an **AWS EC2** instance running Ubuntu 22.04/24.04 LTS or Amazon Linux 2023.

---

## 1. Prerequisites & EC2 Instance Sizing

### Recommended EC2 Instance
- **Instance Type:** `t3.medium` (2 vCPU, 4 GiB RAM) or `t3.small` (2 vCPU, 2 GiB RAM)
- **Operating System:** Ubuntu 22.04 LTS or 24.04 LTS (x86_64)
- **Storage:** 20 GiB gp3 EBS Volume

### AWS Security Group Configuration
In the AWS EC2 Management Console, ensure your Security Group allows the following inbound rules:

| Type | Protocol | Port Range | Source | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **SSH** | TCP | `22` | Your IP / `0.0.0.0/0` | Secure Shell Admin Access |
| **HTTP** | TCP | `80` | `0.0.0.0/0` | Public Web Traffic |
| **HTTPS** | TCP | `443` | `0.0.0.0/0` | SSL/TLS Secured Web Traffic |
| **Custom TCP** | TCP | `5000` | Optional / Internal | Direct Application Port (optional if proxied via Nginx) |

---

## 2. Automated 1-Script Deployment (Recommended)

1. **Connect to your EC2 instance via SSH:**
   ```bash
   ssh -i /path/to/your-key.pem ubuntu@<your-ec2-public-ip>
   ```

2. **Clone your repository or upload the codebase:**
   ```bash
   git clone <your-repo-url> /var/www/requirement-analyzer
   cd /var/www/requirement-analyzer
   ```

3. **Make the automated setup script executable and run it:**
   ```bash
   chmod +x deploy/ec2-setup.sh
   ./deploy/ec2-setup.sh
   ```

The script will automatically:
- Install Node.js 22 LTS, npm, and build tools
- Install PM2 process manager
- Configure and build the production React frontend bundle
- Install and configure Nginx reverse proxy on port 80
- Start the server under PM2 with autorestart and log management
- Enable systemd persistence so the app survives server reboots

---

## 3. Manual Step-by-Step Deployment

If you prefer to configure the server manually:

### Step 1: Install Node.js & Dependencies
```bash
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y curl wget git build-essential nginx ufw

# Install Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 and tsx
sudo npm install -g pm2 tsx
```

### Step 2: Install Project Dependencies & Build
```bash
cd /var/www/requirement-analyzer

# Install root dependencies
npm install

# Install client dependencies & build static bundle
npm --prefix client install
npm --prefix client run build

# Create data and uploads directories
mkdir -p data uploads logs
```

### Step 3: Configure Environment Variables
```bash
cp .env.example .env
nano .env
```
Ensure the following variables are configured:
```env
PORT=5000
NODE_ENV=production
DATABASE_PATH=/var/www/requirement-analyzer/data/analyzer.db

# Optional AI API Keys (Leave blank to use built-in High-Accuracy Engine)
GEMINI_API_KEY=
OPENAI_API_KEY=
```

### Step 4: Configure Nginx Reverse Proxy
```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/requirement-analyzer
sudo ln -sf /etc/nginx/sites-available/requirement-analyzer /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 5: Start with PM2
```bash
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup
```

---

## 4. Docker Deployment on EC2

If your organization prefers containerized deployments with Docker:

1. **Install Docker & Docker Compose on EC2:**
   ```bash
   sudo apt-get install -y docker.io docker-compose-v2
   sudo usermod -aG docker $USER
   newgrp docker
   ```

2. **Launch with Docker Compose:**
   ```bash
   docker compose up -d --build
   ```

3. **Check container status:**
   ```bash
   docker compose ps
   docker compose logs -f
   ```

---

## 5. SSL / HTTPS Configuration (Certbot)

To secure your application with a custom domain and free Let's Encrypt SSL certificate:

1. **Point your domain's DNS A Record to your EC2 Public IP address.**
2. **Install Certbot:**
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   ```
3. **Generate SSL certificate:**
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```
4. Certbot will automatically renew your certificates via systemd timer.

---

## 6. Management & Monitoring Commands

- **Check PM2 Status:** `pm2 status`
- **View Live Application Logs:** `pm2 logs requirement-analyzer`
- **Restart Application:** `pm2 restart requirement-analyzer`
- **Stop Application:** `pm2 stop requirement-analyzer`
- **Nginx Error Logs:** `sudo tail -f /var/log/nginx/error.log`
- **Check Database File:** `ls -lh /var/www/requirement-analyzer/data/`
