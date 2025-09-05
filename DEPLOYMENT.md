# Snapp Clone - VPS Deployment Guide

This guide provides step-by-step instructions for deploying the Snapp Clone application on a VPS using Docker.

## Prerequisites

- VPS with Ubuntu 20.04+ or similar Linux distribution
- Docker and Docker Compose installed
- Domain name (optional, for HTTPS)
- At least 2GB RAM and 20GB storage

## Quick Start

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again to apply docker group changes
```

### 2. Deploy Application

```bash
# Clone repository
git clone <your-repo-url>
cd snappclone-react-native

# Create environment file
cp .env.example .env

# Edit environment variables
nano .env

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

### 3. Database Setup

```bash
# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database (optional)
docker-compose exec backend npm run seed
```

## Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/snapp_clone
POSTGRES_DB=snapp_clone
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123

# Redis
REDIS_URL=redis://redis:6379

# Backend
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=3000

# Admin Panel
VITE_API_URL=http://your-domain.com/api

# SSL (for HTTPS)
SSL_CERT_PATH=./ssl/cert.pem
SSL_KEY_PATH=./ssl/key.pem
```

## Service Architecture

### Services Overview

1. **PostgreSQL** (`postgres:5432`) - Main database
2. **Redis** (`redis:6379`) - Caching and sessions
3. **Backend API** (`backend:3000`) - Node.js/Express API
4. **Admin Panel** (`admin:5173`) - React admin interface
5. **Nginx** (`nginx:80/443`) - Reverse proxy and load balancer

### Network Architecture

```
Internet → Nginx (80/443) → Backend API (3000)
                         → Admin Panel (5173)
                         → Database (5432)
                         → Redis (6379)
```

## Production Deployment

### 1. Domain and SSL Setup

```bash
# Install Certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot --nginx -d your-domain.com

# Create SSL directory
mkdir -p ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*
```

### 2. Update Nginx Configuration

Uncomment and configure the HTTPS server block in `nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    # ... rest of configuration
}
```

### 3. Production Environment

Update `.env` for production:

```env
NODE_ENV=production
JWT_SECRET=generate-a-strong-random-secret
DATABASE_URL=postgresql://postgres:strong-password@postgres:5432/snapp_clone
POSTGRES_PASSWORD=strong-password
VITE_API_URL=https://your-domain.com/api
```

## Management Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### Update Application
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database Operations
```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Access database
docker-compose exec postgres psql -U postgres -d snapp_clone

# Backup database
docker-compose exec postgres pg_dump -U postgres snapp_clone > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres snapp_clone < backup.sql
```

## Monitoring and Maintenance

### Health Checks

- Backend API: `http://your-domain.com/health`
- Admin Panel: `http://your-domain.com/admin`
- Database: Check with `docker-compose ps`

### Log Management

```bash
# Rotate logs
docker system prune -f

# Monitor disk usage
df -h
docker system df
```

### Backup Strategy

```bash
#!/bin/bash
# backup.sh - Run daily via cron

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
docker-compose exec -T postgres pg_dump -U postgres snapp_clone > $BACKUP_DIR/db_$DATE.sql

# Compress and clean old backups
gzip $BACKUP_DIR/db_$DATE.sql
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 80, 443, 3000, 5432, 6379 are available
2. **Memory issues**: Monitor with `docker stats`
3. **Database connection**: Check DATABASE_URL format
4. **SSL issues**: Verify certificate paths and permissions

### Debug Commands

```bash
# Check service status
docker-compose ps

# View service logs
docker-compose logs backend

# Access container shell
docker-compose exec backend sh

# Test database connection
docker-compose exec backend npx prisma db pull

# Check network connectivity
docker-compose exec backend ping postgres
```

## Security Considerations

1. **Change default passwords** in production
2. **Use strong JWT secrets**
3. **Enable firewall** (ufw) and only open necessary ports
4. **Regular updates** of Docker images and system packages
5. **Monitor logs** for suspicious activity
6. **Backup regularly** and test restore procedures

## Performance Optimization

1. **Resource limits**: Set memory and CPU limits in docker-compose.yml
2. **Database tuning**: Optimize PostgreSQL configuration
3. **Caching**: Utilize Redis for session and data caching
4. **CDN**: Use CDN for static assets in production
5. **Monitoring**: Implement monitoring with Prometheus/Grafana

## Support

For issues and questions:
1. Check logs: `docker-compose logs`
2. Review this documentation
3. Check GitHub issues
4. Contact development team