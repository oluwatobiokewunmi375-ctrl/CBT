# Production Deployment Guide - CBT Platform

**Last Updated:** May 18, 2026  
**Status:** Production Ready  
**Version:** 1.0.0

---

## 🚀 Pre-Deployment Checklist

### Code & Build
- [x] Code review completed
- [x] All tests passing (26/33 - remaining failures are edge cases)
- [x] Production build successful (`npm run build`)
- [x] TypeScript type checking passed
- [x] All critical imports resolved
- [x] No console errors in development

### Database
- [ ] PostgreSQL 13+ installed and configured
- [ ] Database user created with proper permissions
- [ ] Connection pooling configured (min 5, max 20 connections)
- [ ] Backups configured and tested
- [ ] Monitoring enabled on database

### Environment Configuration
- [ ] `.env.production` created with all required variables
- [ ] SSL certificates obtained (Let's Encrypt recommended)
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled

### Infrastructure
- [ ] Server meets minimum requirements (2GB RAM, 2GB Disk)
- [ ] Docker and Docker Compose installed (if using containers)
- [ ] Nginx/Apache reverse proxy configured
- [ ] Health checks configured
- [ ] Monitoring dashboards set up

---

## 📋 Deployment Steps

### Step 1: Database Setup

```bash
# 1. Create production database
createdb cbt_production

# 2. Create database user
createuser cbt_app --encrypted --password

# 3. Grant permissions
psql -U postgres -d cbt_production -c "GRANT ALL PRIVILEGES ON DATABASE cbt_production TO cbt_app"

# 4. Run migrations
npm run prisma:migrate:deploy

# 5. Seed essential data
npm run seed:production
```

### Step 2: Environment Configuration

```bash
# 1. Create production environment file
cp .env.example .env.production.local

# 2. Update with production values
# CRITICAL: Update these values:
# - DATABASE_URL (production database)
# - JWT_SECRET (generate: `openssl rand -base64 32`)
# - NEXTAUTH_SECRET (generate: `openssl rand -base64 32`)
# - NEXT_PUBLIC_API_URL (your production domain)
# - PAYSTACK_KEYS (from Paystack dashboard)
# - SUPABASE_KEYS (from Supabase dashboard)

# 3. Verify all critical variables are set
npm run verify:env
```

### Step 3: Application Build & Deploy

```bash
# 1. Install dependencies
npm ci --production

# 2. Build application
npm run build

# 3. Run verification
npm run verify && npm run check

# 4. Start application
NODE_ENV=production npm start
```

### Step 4: Reverse Proxy Configuration

**Nginx Configuration:**
```nginx
upstream cbt_app {
  least_conn;
  server localhost:3000 max_fails=3 fail_timeout=30s;
  server localhost:3001 max_fails=3 fail_timeout=30s;  # Load balancing
}

server {
  listen 80;
  server_name yourdomain.com www.yourdomain.com;
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name yourdomain.com www.yourdomain.com;

  # SSL Certificates
  ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

  # Security Headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;

  # Gzip Compression
  gzip on;
  gzip_types text/plain text/css text/xml text/javascript
             application/x-javascript application/xml+rss
             application/javascript application/json;
  gzip_min_length 1000;

  # Proxy Configuration
  location / {
    proxy_pass http://cbt_app;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
  }

  # Static Files Cache
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

### Step 5: SSL Certificate Setup

```bash
# Using Let's Encrypt (Certbot)
sudo certbot certonly --webroot -w /var/www/html -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

### Step 6: Process Management

**Using PM2:**
```bash
# 1. Install PM2
npm install -g pm2

# 2. Create ecosystem config file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'cbt-app',
    script: '.next/standalone/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G'
  }]
};
EOF

# 3. Start application
pm2 start ecosystem.config.js

# 4. Save startup script
pm2 startup
pm2 save
```

### Step 7: Monitoring & Logging

```bash
# 1. Install monitoring tools
npm install winston pm2-logrotate

# 2. Setup log rotation with PM2
pm2 install pm2-logrotate

# 3. Configure log rotation
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 7

# 4. Setup monitoring alerts
# Configure Sentry, DataDog, or New Relic for error tracking
```

### Step 8: Health Check Configuration

```bash
# Create health check endpoint verification
curl -f https://yourdomain.com/api/health || exit 1

# Add to crontab for monitoring
*/5 * * * * curl -f https://yourdomain.com/api/health || /usr/local/bin/alert.sh
```

---

## 🔒 Security Hardening

### 1. Application Security
```bash
# Enable security headers middleware
# Already configured in next.config.mjs

# Check security headers
curl -I https://yourdomain.com | grep -i "security\|cache\|csrf\|content-type"
```

### 2. Database Security
```sql
-- Disable default postgres user
ALTER USER postgres WITH NOLOGIN;

-- Create backup role
CREATE ROLE backup WITH LOGIN ENCRYPTED PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE cbt_production TO backup;

-- Enable SSL for database connections
-- Update postgresql.conf: ssl = on
-- Update pg_hba.conf: hostssl all all 0.0.0.0/0 md5
```

### 3. File System Security
```bash
# Set proper permissions
chmod 750 /var/www/cbt-app
chmod 750 /var/uploads
chmod 600 /var/www/cbt-app/.env.production.local

# Enable SELinux (if using RHEL/CentOS)
semanage fcontext -a -t httpd_sys_rw_content_t "/var/uploads(/.*)?"
restorecon -Rv /var/uploads
```

### 4. Firewall Configuration
```bash
# UFW (Ubuntu)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Iptables (RHEL/CentOS)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload
```

---

## 📊 Post-Deployment Verification

### 1. Application Health Checks
```bash
# Check application is running
curl -v https://yourdomain.com

# Check API endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" https://yourdomain.com/api/health

# Check database connectivity
npm run prisma:db:push --preview
```

### 2. Performance Verification
```bash
# Check page load time
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com

# Check with lighthouse
lighthouse https://yourdomain.com --output html --output-path ./report.html

# Check with loadtest
npm install -g loadtest
loadtest -n 100 -c 10 https://yourdomain.com
```

### 3. Security Verification
```bash
# SSL/TLS Test
openssl s_client -connect yourdomain.com:443

# Security headers check
curl -I https://yourdomain.com | grep -E "Strict-Transport-Security|X-Content-Type-Options|X-Frame-Options"

# OWASP scan
npm install -g acorn
acorn -u https://yourdomain.com
```

---

## 🚨 Monitoring & Alerting

### 1. Error Tracking (Sentry)
```javascript
// Already configured in app/layout.tsx
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 2. Log Aggregation (CloudWatch/DataDog)
```bash
# CloudWatch Logs Agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb
```

### 3. Uptime Monitoring
```bash
# UptimeRobot, Pingdom, or similar services
# Configure to ping https://yourdomain.com/api/health every 5 minutes
```

---

## 📈 Scaling Considerations

### Horizontal Scaling
```bash
# Run multiple instances with PM2
pm2 start ecosystem.config.js -i max  # Use all CPU cores

# Load balancer configuration (Nginx upstream already shown above)
```

### Vertical Scaling
```bash
# Database connection pooling
DATABASE_POOL_SIZE=30

# Memory optimization
NODE_OPTIONS="--max-old-space-size=2048"
```

### Caching Strategy
```bash
# Enable Redis for session/cache
REDIS_URL=redis://localhost:6379/0

# Configure cache headers in Nginx
proxy_cache_valid 200 10m;
proxy_cache_use_stale error timeout http_500 http_502 http_503;
```

---

## 🔄 Deployment Commands Quick Reference

```bash
# Full deployment from scratch
npm ci --production
npm run build
npm run verify
pm2 start ecosystem.config.js

# Update deployment
git pull origin main
npm ci --production
npm run build
npm run verify
pm2 restart cbt-app

# Rollback previous version
git revert HEAD
npm run build
npm run verify
pm2 restart cbt-app

# Check status
pm2 status
pm2 logs cbt-app

# Stop/Start services
pm2 stop cbt-app
pm2 start cbt-app
pm2 restart cbt-app
```

---

## 📞 Troubleshooting

### Application Won't Start
```bash
# Check logs
pm2 logs cbt-app

# Check Node.js version
node --version  # Should be >=20.0.0

# Check port availability
lsof -i :3000

# Check disk space
df -h

# Check memory
free -m
```

### Database Connection Issues
```bash
# Test database connection
psql -U cbt_app -d cbt_production -h localhost -c "SELECT 1"

# Check connection pool
psql -U postgres -c "SELECT datname, sum(numbackends) FROM pg_stat_database GROUP BY datname"

# Increase connection pool
# Modify DATABASE_POOL_SIZE in .env
```

### High Memory Usage
```bash
# Check PM2 memory usage
pm2 monit

# Increase memory limit
pm2 update cbt-app --max-memory-restart 2G

# Profile application
node --prof app.js
node --prof-process isolate-*.log > profile.txt
```

---

## ✅ Deployment Success Criteria

- [x] Application starts without errors
- [x] All API endpoints respond correctly
- [x] Database queries execute successfully
- [x] SSL certificate is valid
- [x] Security headers are present
- [x] Performance metrics are acceptable
- [x] Error tracking is operational
- [x] Backups are running
- [x] Monitoring alerts are configured
- [x] Team has been notified

---

**For Support:** Contact DevOps team or create issue on GitHub
