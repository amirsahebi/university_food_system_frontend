# Javan Foods Deployment Guide

## Prerequisites
- Ubuntu/Debian Server
- Node.js (v18+)
- Nginx
- PM2 Process Manager

## Deployment Steps

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2
```

### 2. Project Deployment
```bash
# Clone the project
git clone https://github.com/your-repo/javan-reserve-front.git
cd javan-reserve-front

# Install dependencies
npm install

# Build the project
npm run build

# Start with PM2
pm2 start npm --name "javan-foods" -- start
pm2 startup
pm2 save
```

### 3. Nginx Configuration
```nginx
server {
    listen 80;
    server_name javanfoods.com www.javanfoods.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. SSL with Certbot
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d javanfoods.com -d www.javanfoods.com
```

### 5. Firewall Configuration
```bash
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Monitoring
- Check logs: `pm2 logs javan-foods`
- Restart app: `pm2 restart javan-foods`
